const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
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
import android.os.CancellationSignal;
import android.service.autofill.AutofillService;
import android.service.autofill.FillCallback;
import android.service.autofill.FillRequest;
import android.service.autofill.FillResponse;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveRequest;
import android.util.Log;

public class DrivePassAutofillService extends AutofillService {
    private static final String TAG = "DrivePassAutofill";

    @Override
    public void onFillRequest(FillRequest request, CancellationSignal cancellationSignal, FillCallback callback) {
        Log.d(TAG, "onFillRequest called");
        try {
            // Very basic empty response for now just to show it handles requests
            FillResponse response = new FillResponse.Builder().build();
            callback.onSuccess(response);
        } catch (Exception e) {
            Log.e(TAG, "Error in onFillRequest", e);
            callback.onFailure(e.getMessage());
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

import androidx.annotation.NonNull;

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

module.exports = function withAutofill(config) {
  config = withAutofillManifest(config);
  config = withAutofillFiles(config);
  return config;
};
