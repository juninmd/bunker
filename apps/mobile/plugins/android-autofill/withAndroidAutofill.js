const { withAndroidManifest, withDangerousMod, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAutofillManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    // Clean existing service entry if exists to avoid duplicates
    if (application.service) {
      application.service = application.service.filter(s => s.$['android:name'] !== '.DrivePassAutofillService');
    } else {
      application.service = [];
    }

    application.service.push({
      '$': {
        'android:name': '.DrivePassAutofillService',
        'android:label': 'DrivePass Autofill',
        'android:permission': 'android.permission.BIND_AUTOFILL_SERVICE'
      },
      'intent-filter': [{
        'action': [{
          '$': {
            'android:name': 'android.service.autofill.AutofillService'
          }
        }]
      }],
      'meta-data': [{
        '$': {
          'android:name': 'android.autofill',
          'android:resource': '@xml/autofill_service_config'
        }
      }]
    });

    return config;
  });
};

const withAutofillFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resPath = path.join(projectRoot, 'android/app/src/main/res');

      const xmlPath = path.join(resPath, 'xml');
      fs.mkdirSync(xmlPath, { recursive: true });
      fs.writeFileSync(path.join(xmlPath, 'autofill_service_config.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<autofill-service xmlns:android="http://schemas.android.com/apk/res/android" />`);

      const packageName = config.android.package || 'com.drivepass.android';
      const packagePath = packageName.replace(/\./g, '/');
      const javaPath = path.join(projectRoot, 'android/app/src/main/java', packagePath);
      fs.mkdirSync(javaPath, { recursive: true });

      const serviceCode = `package ${packageName};

import android.app.assist.AssistStructure;
import android.app.assist.AssistStructure.ViewNode;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.CancellationSignal;
import android.service.autofill.AutofillService;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKeys;
import android.service.autofill.Dataset;
import android.service.autofill.FillCallback;
import android.service.autofill.FillContext;
import android.service.autofill.FillRequest;
import android.service.autofill.FillResponse;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveRequest;
import android.util.Log;
import android.view.autofill.AutofillId;
import android.view.autofill.AutofillValue;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class DrivePassAutofillService extends AutofillService {
    private static final String TAG = "DrivePassAutofill";

    @Override
    public void onFillRequest(FillRequest request, CancellationSignal cancellationSignal, FillCallback callback) {
        Log.d(TAG, "onFillRequest called");
        try {
            List<FillContext> contexts = request.getFillContexts();
            AssistStructure structure = contexts.get(contexts.size() - 1).getStructure();

            List<ViewNode> usernameNodes = new ArrayList<>();
            List<ViewNode> passwordNodes = new ArrayList<>();
            final String[] extractedWebDomain = new String[1];

            traverseStructure(structure.getWindowNodeAt(0).getRootViewNode(), usernameNodes, passwordNodes, extractedWebDomain);

            if (usernameNodes.isEmpty() && passwordNodes.isEmpty()) {
                callback.onSuccess(null);
                return;
            }

            String currentPackage = "";
            if (structure.getActivityComponent() != null) {
                currentPackage = structure.getActivityComponent().getPackageName();
            }
            String currentWebDomain = extractedWebDomain[0] != null ? extractedWebDomain[0] : "";

            SharedPreferences prefs = EncryptedSharedPreferences.create(
                    "DrivePassAutofill",
                    MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
                    this,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
            String json = prefs.getString("credentials", "[]");
            JSONArray credentials = new JSONArray(json);

            FillResponse.Builder responseBuilder = new FillResponse.Builder();
            int matchedCount = 0;

            for (int i = 0; i < credentials.length(); i++) {
                JSONObject cred = credentials.getJSONObject(i);
                String title = cred.optString("title", "Unknown");
                String user = cred.optString("username", "");
                String pass = cred.optString("password", "");

                boolean match = false;
                String lowerTitle = title.toLowerCase();
                String lowerUser = user.toLowerCase();

                // Exact matching for Android apps
                if (!currentPackage.isEmpty() && (lowerTitle.equals(currentPackage) || currentPackage.equals(lowerTitle))) {
                    match = true;
                }
                // Strip protocols and paths for exact domain matching
                if (!currentWebDomain.isEmpty()) {
                    String cleanDomain = currentWebDomain.replaceFirst("^(https?://)?(www\\\\.)?", "").split("/")[0].toLowerCase();
                    String cleanTitle = lowerTitle.replaceFirst("^(https?://)?(www\\\\.)?", "").split("/")[0];
                    if (cleanDomain.equals(cleanTitle)) {
                        match = true;
                    }
                }

                if (!match) continue;

                Dataset.Builder datasetBuilder = new Dataset.Builder();
                boolean added = false;

                RemoteViews presentation = new RemoteViews(getPackageName(), android.R.layout.simple_list_item_1);
                presentation.setTextViewText(android.R.id.text1, title + (!user.isEmpty() ? " (" + user + ")" : ""));

                for (ViewNode node : usernameNodes) {
                    if (node.getAutofillId() != null) {
                        datasetBuilder.setValue(node.getAutofillId(), AutofillValue.forText(user), presentation);
                        added = true;
                    }
                }
                for (ViewNode node : passwordNodes) {
                    if (node.getAutofillId() != null) {
                        datasetBuilder.setValue(node.getAutofillId(), AutofillValue.forText(pass), presentation);
                        added = true;
                    }
                }

                if (added) {
                    responseBuilder.addDataset(datasetBuilder.build());
                    matchedCount++;
                    if (matchedCount >= 5) break;
                }
            }

            if (matchedCount > 0) {
                callback.onSuccess(responseBuilder.build());
            } else {
                callback.onSuccess(null);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onFillRequest", e);
            callback.onFailure(e.getMessage());
        }
    }

    private void traverseStructure(ViewNode node, List<ViewNode> usernameNodes, List<ViewNode> passwordNodes, String[] webDomain) {
        if (node.getWebDomain() != null) {
            webDomain[0] = node.getWebDomain();
        }

        if (node.getAutofillHints() != null) {
            for (String hint : node.getAutofillHints()) {
                String lowerHint = hint.toLowerCase();
                if (lowerHint.contains("username") || lowerHint.contains("email")) {
                    usernameNodes.add(node);
                } else if (lowerHint.contains("password")) {
                    passwordNodes.add(node);
                }
            }
        } else {
            int inputType = node.getInputType();
            // TYPE_TEXT_VARIATION_PASSWORD = 128, TYPE_TEXT_VARIATION_WEB_PASSWORD = 224, TYPE_NUMBER_VARIATION_PASSWORD = 16
            if ((inputType & 128) == 128 || (inputType & 224) == 224 || (inputType & 16) == 16) {
                passwordNodes.add(node);
            } else if (node.getHint() != null) {
                String hint = node.getHint().toString().toLowerCase();
                if (hint.contains("username") || hint.contains("email") || hint.contains("user")) {
                    usernameNodes.add(node);
                } else if (hint.contains("password")) {
                    passwordNodes.add(node);
                }
            }
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            traverseStructure(node.getChildAt(i), usernameNodes, passwordNodes, webDomain);
        }
    }

    @Override
    public void onSaveRequest(SaveRequest request, SaveCallback callback) {
        Log.d(TAG, "onSaveRequest called");
        callback.onSuccess();
    }
}
`;
      fs.writeFileSync(path.join(javaPath, 'DrivePassAutofillService.java'), serviceCode);

      // We also need a Native Module to let JS prompt the user to enable Autofill settings
      const moduleCode = `package ${packageName};

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.view.autofill.AutofillManager;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKeys;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AutofillModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    AutofillModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "AutofillModule";
    }

    @ReactMethod
    public void hasAutofillSupport(Promise promise) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            AutofillManager autofillManager = reactContext.getSystemService(AutofillManager.class);
            promise.resolve(autofillManager != null && autofillManager.isAutofillSupported());
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void isAutofillEnabled(Promise promise) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            AutofillManager autofillManager = reactContext.getSystemService(AutofillManager.class);
            promise.resolve(autofillManager != null && autofillManager.hasEnabledAutofillServices());
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void requestAutofillSetting() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE);
            intent.setData(android.net.Uri.parse("package:" + reactContext.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                reactContext.startActivity(intent);
            } catch (Exception e) {
                // Fallback to general settings
                Intent generalIntent = new Intent(Settings.ACTION_SETTINGS);
                generalIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(generalIntent);
            }
        }
    }

    @ReactMethod
    public void saveCredentials(String json) {
        try {
            String masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC);
            SharedPreferences prefs = EncryptedSharedPreferences.create(
                    "DrivePassAutofill",
                    masterKeyAlias,
                    reactContext,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
            prefs.edit().putString("credentials", json).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`;
      fs.writeFileSync(path.join(javaPath, 'AutofillModule.java'), moduleCode);

      const packageCode = `package ${packageName};

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AutofillPackage implements ReactPackage {

    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new AutofillModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;
      fs.writeFileSync(path.join(javaPath, 'AutofillPackage.java'), packageCode);

      // Update MainApplication.kt to include AutofillPackage
      const mainAppPath = path.join(javaPath, 'MainApplication.kt');
      if (fs.existsSync(mainAppPath)) {
          let mainAppContent = fs.readFileSync(mainAppPath, 'utf8');
          // Simple regex to insert the package. This is a bit fragile but works for the default Expo template.
          if (!mainAppContent.includes('AutofillPackage()')) {
              mainAppContent = mainAppContent.replace(
                  /override fun getPackages\(\): List<ReactPackage> =.*?PackageList\(this\)\.packages\.apply \{/s,
                  match => match + '\n          add(AutofillPackage())'
              );
              fs.writeFileSync(mainAppPath, mainAppContent);
          }
      }

      return config;
    },
  ]);
};

const withAutofillGradle = (config) => {
  return withAppBuildGradle(config, async config => {
    const buildGradle = config.modResults.contents;
    const dependency = "implementation 'androidx.security:security-crypto:1.1.0-alpha06'";

    // Check if the dependency is already added to avoid duplicates
    if (!buildGradle.includes("androidx.security:security-crypto")) {
      config.modResults.contents = buildGradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    ${dependency}`
      );
    }
    return config;
  });
};

module.exports = function withAutofill(config) {
  config = withAutofillManifest(config);
  config = withAutofillFiles(config);
  config = withAutofillGradle(config);
  return config;
};
