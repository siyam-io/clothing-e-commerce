export default function cloudinaryLoader({ src, width, quality }) {
  if (!src) return '';
  if (src.startsWith('blob:') || src.startsWith('data:')) return src;

  // Preserve external non-cloudinary images
  if (src.startsWith('http') && !src.includes('cloudinary.com')) {
    return src;
  }

  // Handle local backend uploads
  const normalizedPath = src.replace(/^\/+/, '');
  if (normalizedPath.startsWith('uploads/')) {
    const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:5000';
    return `${imageBaseUrl}/${normalizedPath}`;
  }

  if (src.startsWith('/') && !src.includes('cloudinary.com')) return src;

  let path = src;
  let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (src.includes('cloudinary.com')) {
    const urlParts = src.split('/');
    const cloudNameIndex = urlParts.indexOf('res.cloudinary.com') + 1;
    if (cloudNameIndex > 0 && urlParts[cloudNameIndex]) {
      cloudName = urlParts[cloudNameIndex];
    }

    path = src.split('/upload/')[1] || src;
    const pathParts = path.split('/');
    // Strip previous transformation flags to prevent nested transformations
    while (pathParts.length > 1 && (pathParts[0].includes('_') || pathParts[0].includes(','))) {
      pathParts.shift();
    }
    path = pathParts.join('/');
  }

  if (!cloudName) return src;

  // Use slash-delimited transformations so that HTML srcset parser does not split URLs on commas
  const transformations = ['f_auto', 'q_auto', 'c_limit', `w_${width}`];
  if (quality && quality !== 'auto') {
    transformations.push(`q_${quality}`);
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join('/')}/${path}`;
}
