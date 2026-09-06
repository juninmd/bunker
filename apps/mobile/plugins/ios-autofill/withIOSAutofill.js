const {
  withXcodeProject,
  withDangerousMod,
  withEntitlementsPlist,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const EXTENSION_NAME = 'DrivePassAutofill';
const BUNDLE_IDENTIFIER_SUFFIX = 'autofill';

function addEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    if (!config.modResults) {
        config.modResults = {};
    }
    const entitlements = config.modResults;
    entitlements['com.apple.developer.authentication-services.autofill-credential-provider'] = true;

    if (!entitlements['keychain-access-groups']) {
      entitlements['keychain-access-groups'] = [];
    }
    const group = `$(AppIdentifierPrefix)${config.ios?.bundleIdentifier || 'com.drivepass.app'}`;
    if (!entitlements['keychain-access-groups'].includes(group)) {
      entitlements['keychain-access-groups'].push(group);
    }
    return config;
  });
}

function createExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const extensionPath = path.join(projectRoot, 'ios', EXTENSION_NAME);

      fs.mkdirSync(extensionPath, { recursive: true });

      const infoPlistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>DrivePass Autofill</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleVersion</key>
	<string>1</string>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionAttributes</key>
		<dict>
			<key>ASCredentialProviderExtensionShowsConfigurationUI</key>
			<false/>
		</dict>
		<key>NSExtensionPrincipalClass</key>
		<string>$(PRODUCT_MODULE_NAME).CredentialProviderViewController</string>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.authentication-services-credential-provider-ui</string>
	</dict>
</dict>
</plist>`;
      fs.writeFileSync(path.join(extensionPath, 'Info.plist'), infoPlistContent);

      const swiftContent = `import AuthenticationServices

class CredentialProviderViewController: ASCredentialProviderViewController {

    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        let ext = NSExtensionContext()
        ext.completeRequest(returningItems: [], completionHandler: nil)
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }

    override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        self.extensionContext?.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.userInteractionRequired.rawValue, userInfo: nil))
    }

    override func prepareInterfaceToProvideCredential(for credentialIdentity: ASPasswordCredentialIdentity) {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }

    override func prepareInterfaceForExtensionConfiguration() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
}
`;
      fs.writeFileSync(path.join(extensionPath, 'CredentialProviderViewController.swift'), swiftContent);

      const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.authentication-services.autofill-credential-provider</key>
    <true/>
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)${config.ios?.bundleIdentifier || 'com.drivepass.app'}</string>
    </array>
</dict>
</plist>`;
      fs.writeFileSync(path.join(extensionPath, `${EXTENSION_NAME}.entitlements`), entitlementsContent);

      return config;
    },
  ]);
}

function modifyXcodeProject(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const bundleIdentifier = config.ios?.bundleIdentifier || 'com.drivepass.app';

    try {
        const proj = project;

        const pbxGroup = proj.pbxGroupByName(EXTENSION_NAME);
        if(!pbxGroup) {
            const group = proj.addPbxGroup([
                'CredentialProviderViewController.swift',
                'Info.plist',
                `${EXTENSION_NAME}.entitlements`
            ], EXTENSION_NAME, EXTENSION_NAME);

            const groups = proj.hash.project.objects.PBXGroup;
            const mainGroupKey = Object.keys(groups).find(k => groups[k].name === undefined && groups[k].path === undefined);
            if (mainGroupKey) {
                proj.addToPbxGroup(group.uuid, mainGroupKey);
            }

            const target = proj.addTarget(EXTENSION_NAME, 'app_extension', EXTENSION_NAME, `${bundleIdentifier}.${BUNDLE_IDENTIFIER_SUFFIX}`);

            proj.addBuildPhase(
                ['CredentialProviderViewController.swift'],
                'PBXSourcesBuildPhase',
                'Sources',
                target.uuid
            );

            const options = {
                INFOPLIST_FILE: `${EXTENSION_NAME}/Info.plist`,
                PRODUCT_BUNDLE_IDENTIFIER: `${bundleIdentifier}.${BUNDLE_IDENTIFIER_SUFFIX}`,
                CODE_SIGN_ENTITLEMENTS: `${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements`,
                SWIFT_VERSION: '5.0',
                TARGETED_DEVICE_FAMILY: '1,2',
                MARKETING_VERSION: '1.0',
                CURRENT_PROJECT_VERSION: '1'
            };

            proj.addBuildProperty('INFOPLIST_FILE', `"${options.INFOPLIST_FILE}"`, null, target.name);
            proj.addBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', `"${options.PRODUCT_BUNDLE_IDENTIFIER}"`, null, target.name);
            proj.addBuildProperty('CODE_SIGN_ENTITLEMENTS', `"${options.CODE_SIGN_ENTITLEMENTS}"`, null, target.name);
            proj.addBuildProperty('SWIFT_VERSION', options.SWIFT_VERSION, null, target.name);
        }
    } catch (e) {
        console.error("Error modifying xcode project: ", e);
    }

    return config;
  });
}

module.exports = function withIOSAutofill(config) {
  config = addEntitlements(config);
  config = createExtensionFiles(config);
  config = modifyXcodeProject(config);
  return config;
};
