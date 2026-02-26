// Reads the build script output and extracts the TS content between markers
// Then outputs it for capture

const BLOB_URLS = {
  project:       "https://blobs.vusercontent.net/blob/project-56uzHDoDPo06pj6X15XWtyx4Md1xFq.json",
  scenes:        "https://blobs.vusercontent.net/blob/scenes-WN5BNK1WWsyVwqRYCtOXf0552n2dsL.json",
  characters:    "https://blobs.vusercontent.net/blob/characters-dZf9e9RX7CO61o96pyTSriW7AazYFI.json",
  locations:     "https://blobs.vusercontent.net/blob/locations-X8pkmwNukw12NZOYbmDOHrGBHKHLb8.json",
  props:         "https://blobs.vusercontent.net/blob/props-UZsbCINaXV7ANe45af8pEN2MJt0dUs.json",
  effects:       "https://blobs.vusercontent.net/blob/effects-9QErdpxrCjWGWjSWKP51EwYNFRWhnd.json",
  specialActions:"https://blobs.vusercontent.net/blob/special_actions-ypeWrpkU6IdrdAB5tJWAl3SRlsY4nN.json",
  requirements:  "https://blobs.vusercontent.net/blob/requirements-yKlhZAdEkcCH5EZgHjxlnYU8MxylBK.json",
  costumes:      "https://blobs.vusercontent.net/blob/costumes-5miSpyHvgQuOE5RlPeiYWodHXxUI3j.json",
  styling:       "https://blobs.vusercontent.net/blob/styling-AygKDRz7YHSBOk5nEpHctQUaMIJHX1.json",
};

async function main() {
  // Just verify all JSON files are fetchable and print summary
  console.log("Fetching all JSON files to verify...");
  const entries = Object.entries(BLOB_URLS);
  const results = await Promise.all(entries.map(async ([key, url]) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed: " + key);
    const json = await res.json();
    const graph = json["@graph"] || [];
    return [key, graph.length];
  }));
  
  for (const [key, count] of results) {
    console.log("  " + key + ": " + count + " entities");
  }
  console.log("All verified.");
}

main().catch(e => { console.error(e); process.exit(1); });
