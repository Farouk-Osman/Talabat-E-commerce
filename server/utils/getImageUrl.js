const getImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  // If imagePath already an absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const host = req.get('host');
  const {protocol} = req;
  // Ensure leading slash
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${protocol}://${host}${cleanPath}`;
};

module.exports = getImageUrl;
