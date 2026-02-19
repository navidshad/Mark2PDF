
/**
 * Fetches an image from a URL and converts it to a Base64 data string.
 * This function attempts to fetch directly with credentials to leverage browser cookies.
 */
export const fetchImageAsBase64 = async (url: string): Promise<string> => {
	if (url.startsWith('data:')) {
		return url;
	}

	try {
		// Attempt fetch with credentials to handle authenticated images
		const response = await fetch(url, { credentials: 'include' });
		if (!response.ok) throw new Error(`Fetch failed with status: ${response.status}`);

		const blob = await response.blob();
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (err) {
		console.error(`Direct fetch failed for ${url}, trying proxy fallback. Error:`, err);

		// Fallback to proxy for non-authenticated images if direct fetch fails (CORS issue)
		const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
		try {
			const response = await fetch(proxyUrl);
			if (!response.ok) throw new Error(`Proxy failed with status: ${response.status}`);
			const blob = await response.blob();
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		} catch (proxyErr) {
			console.error(`Proxy fallback failed for ${url}:`, proxyErr);
			throw new Error(`Could not fetch image. This is likely due to CORS or Authentication restrictions.`);
		}
	}
};

/**
 * Scans markdown text for image links and replaces them with base64 data URLs.
 */
export const convertMarkdownImagesToBase64 = async (
	markdown: string,
	onProgress: (current: number, total: number) => void
): Promise<string> => {
	// Regex for Markdown images: ![alt](url)
	const mdImageRegex = /!\[(.*?)\]\((.*?)\)/g;
	// Regex for HTML images: <img ... src="url" ...> - handle spaces and case
	const htmlImageRegex = /<img[\s\S]*?src\s*=\s*(["'])(.*?)\1[\s\S]*?>/gi;

	let processedMarkdown = markdown;
	const matches: { fullMatch: string; url: string; type: 'md' | 'html' }[] = [];

	// Find all matches first
	let match;
	while ((match = mdImageRegex.exec(markdown)) !== null) {
		matches.push({ fullMatch: match[0], url: match[2], type: 'md' });
	}
	while ((match = htmlImageRegex.exec(markdown)) !== null) {
		// match[2] is the URL because of the new capture groups for quotes
		matches.push({ fullMatch: match[0], url: match[2], type: 'html' });
	}

	const total = matches.length;
	let current = 0;

	for (const item of matches) {
		try {
			if (!item.url.startsWith('http')) {
				current++;
				continue;
			}

			const base64 = await fetchImageAsBase64(item.url);

			// Replace only this specific match. Using replace with string will replace the first occurrence.
			// Since we loop through all matches, this works as long as we replace the full tag/match.
			processedMarkdown = processedMarkdown.replace(item.fullMatch, item.fullMatch.replace(item.url, base64));
		} catch (err) {
			console.warn(`Could not convert image ${item.url}, keeping original.`, err);
		}
		current++;
		onProgress(current, total);
	}

	return processedMarkdown;
};
