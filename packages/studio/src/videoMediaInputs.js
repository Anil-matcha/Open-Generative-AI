export function getImageInputProfile(model) {
  if (!model) {
    return {
      kind: "frames",
      maxImages: 1,
      supportsEndFrame: false,
      requiresEndFrame: false,
    };
  }

  const imageField = model.imageField || "image_url";
  const imageInput = model.inputs?.[imageField];
  const supportsEndFrame = Boolean(model.lastImageField);
  const requiresEndFrame = supportsEndFrame && Boolean(model.endImageRequired);
  const declaredMaxImages = model.maxImages || imageInput?.maxItems || 1;
  const usesReferenceList = !supportsEndFrame && declaredMaxImages > 1 && (
    imageInput?.type === "array" ||
    imageField === "images_list" ||
    imageField === "image_urls"
  );
  const maxImages = supportsEndFrame
    ? 2
    : declaredMaxImages;

  return {
    kind: usesReferenceList ? "references" : "frames",
    maxImages,
    supportsEndFrame,
    requiresEndFrame,
  };
}

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean))];
}

export function normalizeImageAttachments(profile, attachments) {
  const listUrls = uniqueUrls(attachments.listUrls || []);

  if (profile.kind === "references") {
    const references = listUrls.length > 0
      ? listUrls
      : uniqueUrls([attachments.primaryUrl]);
    return {
      primaryUrl: null,
      listUrls: references.slice(0, profile.maxImages),
      endUrl: null,
    };
  }

  const primaryUrl = attachments.primaryUrl || listUrls[0] || null;
  const endCandidate = attachments.endUrl || listUrls[1] || null;
  const endUrl = profile.supportsEndFrame && endCandidate !== primaryUrl
    ? endCandidate
    : null;

  return {
    primaryUrl,
    listUrls: [],
    endUrl,
  };
}

export function reconcileImageAttachments(
  previousProfile,
  nextProfile,
  attachments,
) {
  const previous = normalizeImageAttachments(previousProfile, attachments);
  const previousCount = previousProfile.kind === "references"
    ? previous.listUrls.length
    : Number(Boolean(previous.primaryUrl)) + Number(Boolean(previous.endUrl));

  if (previousProfile.kind !== nextProfile.kind) {
    return {
      attachments: { primaryUrl: null, listUrls: [], endUrl: null },
      discardedCount: previousCount,
    };
  }

  const next = normalizeImageAttachments(nextProfile, previous);
  const nextCount = nextProfile.kind === "references"
    ? next.listUrls.length
    : Number(Boolean(next.primaryUrl)) + Number(Boolean(next.endUrl));

  return {
    attachments: next,
    discardedCount: previousCount - nextCount,
  };
}

export function getImageAttachmentLabel(profile, index) {
  if (profile.kind === "references") return `REF ${index + 1}`;
  return index === 0 ? "START" : "END";
}
