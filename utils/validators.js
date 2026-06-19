exports.validateMobileCoverData = (data) => {
  const errors = [];

  if (!data.company) errors.push('Company is required');
  if (!data.model) errors.push('Model is required');
  if (!data.category) errors.push('Category is required');
  if (!Array.isArray(data.imageUrls) || data.imageUrls.length === 0) {
    errors.push('At least one image URL is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
