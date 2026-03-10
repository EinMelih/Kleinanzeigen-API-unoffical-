import { loadAppConfig } from "./app-config";

export interface ManualModeState {
  enabled: boolean;
  message: string;
}

export class ManualModeService {
  getState(): ManualModeState {
    const config = loadAppConfig();

    return {
      enabled: config.manualModeOnly,
      message: config.manualModeOnly
        ? "Manual-only mode is enabled. Automated live Kleinanzeigen requests are disabled."
        : "Automated live Kleinanzeigen requests are enabled.",
    };
  }

  isEnabled(): boolean {
    return this.getState().enabled;
  }

  getBlockedMessage(action: string, guidance?: string): string {
    const suffix = guidance
      ? ` ${guidance}`
      : "Use the manual profile login flow instead.";

    return `Manual-only mode is enabled. ${action} is disabled to avoid another Kleinanzeigen IP block.${suffix}`;
  }
}
