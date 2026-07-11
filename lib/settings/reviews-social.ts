export type ReviewsSocialSettings = {
  reviewPromptEnabled: boolean;
  googleReviewUrl: string;
  instagramPromptEnabled: boolean;
  instagramUrl: string;
};

export type ReviewsSocialPrompts = {
  reviewPromptEnabled: boolean;
  googleReviewUrl: string | null;
  reviewFilterEnabled: boolean;
  instagramPromptEnabled: boolean;
  instagramUrl: string | null;
};

export function reviewsSocialFromBusiness(
  business: {
    review_prompt_enabled?: boolean | null;
    review_filter_enabled?: boolean | null;
    google_review_url?: string | null;
    google_review_link?: string | null;
    instagram_prompt_enabled?: boolean | null;
    instagram_url?: string | null;
  } | null
): ReviewsSocialPrompts {
  const googleReviewUrl =
    business?.google_review_url?.trim() ||
    business?.google_review_link?.trim() ||
    null;

  return {
    reviewPromptEnabled: business?.review_prompt_enabled === true,
    googleReviewUrl,
    reviewFilterEnabled: business?.review_filter_enabled !== false,
    instagramPromptEnabled: business?.instagram_prompt_enabled === true,
    instagramUrl: business?.instagram_url?.trim() || null,
  };
}

export function showGoogleReviewPrompt(settings: ReviewsSocialPrompts): boolean {
  return (
    settings.reviewPromptEnabled === true &&
    Boolean(settings.googleReviewUrl?.trim())
  );
}

export function showInstagramPrompt(settings: ReviewsSocialPrompts): boolean {
  return (
    settings.instagramPromptEnabled === true &&
    Boolean(settings.instagramUrl?.trim())
  );
}

export function hasReviewsSocialPrompts(settings: ReviewsSocialPrompts): boolean {
  return showGoogleReviewPrompt(settings) || showInstagramPrompt(settings);
}
