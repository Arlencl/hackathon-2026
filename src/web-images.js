import manifest from '../public/assets/web/manifest.json' with {type:'json'};

// Resolve only our bundled images. Uploaded data URLs and external URLs stay intact.
// Keep source URLs in saved drafts so provenance and pilot bindings remain stable.
const copies=new Map(manifest.entries.map(entry=>[entry.source,entry.output]));
export const webImageUrl=url=>copies.get(url)||url;
