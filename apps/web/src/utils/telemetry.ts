import posthogJs from "posthog-js";

const API_KEY = process.env.NEXT_PUBLIC_POSTHOG_API_KEY as string;
const API_HOST = process.env.NEXT_PUBLIC_POSTHOG_API_HOST as string;

const initPostHog = () => {
  if (typeof window !== "undefined") {
    posthogJs.init(API_KEY, {
      api_host: API_HOST,
      autocapture: false,
      session_recording: {
        maskAllInputs: false,
      },
    });
  }

  return posthogJs;
};

export const posthog = initPostHog();

export const capture = (name: string, props = {}) => {
  posthog.capture(name, props);
};

export const captureOpenAdvancedSearchModal = (props = {}) => {
  capture("advanced search modal opened", props);
};

export const captureToggleDarkModeButtonClick = ({ theme, from }) => {
  capture("toggle dark mode button clicked", { theme, from });
};

export const captureClearFiltersButtonClick = () => {
  capture("clear filters button clicked");
};

export const captureSearchButtonClick = (props = {}) => {
  capture("query searched", props);
};

export const captureAdvanceSearchButtonClick = (props = {}) => {
  capture("query searched", props);
};

export const capturePerPageListChange = (props = {}) => {
  capture("per page list changed", props);
};
