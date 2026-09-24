import {
  type ConfigPlugin,
  withAndroidManifest,
} from "expo/config-plugins";
import type { ConfigContext } from "expo/config";

const developmentEnvironment = "development";

const withDevelopmentCleartextTraffic: ConfigPlugin = (config) =>
  withAndroidManifest(config, (configuredConfig) => {
    const application = configuredConfig.modResults.manifest.application?.[0];

    if (application) {
      application.$["android:usesCleartextTraffic"] = "true";
    }

    return configuredConfig;
  });

export default ({ config }: ConfigContext) => {
  const appEnvironment =
    process.env.EXPO_PUBLIC_APP_ENV ?? developmentEnvironment;
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
  const isDevelopment = appEnvironment === developmentEnvironment;

  return {
    ...config,
    extra: {
      ...config.extra,
      appEnvironment,
      apiBaseUrl,
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        ...(isDevelopment
          ? {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: true,
              },
            }
          : {}),
      },
    },
    plugins: isDevelopment
      ? [...(config.plugins ?? []), withDevelopmentCleartextTraffic]
      : config.plugins,
  };
};
