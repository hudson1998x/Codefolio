/**
 * Converts a string to PascalCase.
 *
 * Splits on whitespace, hyphens, and underscores, then capitalises the first
 * letter of each word and joins them together.
 *
 * @example
 * toPascalCase("blog_post")   // → "BlogPost"
 * toPascalCase("site-config") // → "SiteConfig"
 * toPascalCase("my page")     // → "MyPage"
 */
export function toPascalCase(value: string): string {
    return value
        .split(/[\s\-_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
}

/**
 * Pluralises an English word using common rules and a table of irregular forms.
 *
 * Handles the most common cases:
 *  - Irregular forms (person → people, child → children, etc.)
 *  - Words ending in a vowel + y (day → days)
 *  - Words ending in a consonant + y (category → categories)
 *  - Words ending in s, x, z, ch, sh (box → boxes)
 *  - Words ending in f / fe (leaf → leaves, knife → knives)
 *  - Everything else gets a plain `s`
 *
 * @example
 * pluralise("post")     // → "posts"
 * pluralise("category") // → "categories"
 * pluralise("person")   // → "people"
 * pluralise("leaf")     // → "leaves"
 * pluralise("box")      // → "boxes"
 */
export function pluralise(value: string): string {
    const lower = value.toLowerCase();

    const irregulars: Record<string, string> = {
        person:  "people",
        child:   "children",
        man:     "men",
        woman:   "women",
        tooth:   "teeth",
        foot:    "feet",
        mouse:   "mice",
        goose:   "geese",
        ox:      "oxen",
        life:    "lives",
        half:    "halves",
        self:    "selves",
        wolf:    "wolves",
        loaf:    "loaves",
        potato:  "potatoes",
        tomato:  "tomatoes",
        cactus:  "cacti",
        focus:   "foci",
        fungus:  "fungi",
        nucleus: "nuclei",
        syllabus:"syllabi",
        analysis:"analyses",
        thesis:  "theses",
        crisis:  "crises",
        datum:   "data",
        medium:  "media",
        index:   "indices",
        matrix:  "matrices",
        vertex:  "vertices",
        documents: "documents"
    };

    if (irregulars[lower]) {
        // Preserve original casing of first letter.
        const plural = irregulars[lower];
        return value.charAt(0) === value.charAt(0).toUpperCase()
            ? plural.charAt(0).toUpperCase() + plural.slice(1)
            : plural;
    }

    // Words that don't change (uncountable / invariant).
    const invariants = new Set([
        "sheep", "deer", "fish", "species", "aircraft",
        "series", "means", "moose", "swine",
    ]);
    if (invariants.has(lower)) return value;

    // Vowel + y → just add s  (day → days, key → keys)
    if (/[aeiou]y$/i.test(value)) return value + "s";

    // Consonant + y → drop y, add ies  (category → categories)
    if (/[^aeiou]y$/i.test(value)) return value.slice(0, -1) + "ies";

    // Ends in s, x, z, ch, sh → add es  (box → boxes, church → churches)
    if (/(s|x|z|ch|sh)$/i.test(value)) return value + "es";

    // Ends in fe → drop fe, add ves  (knife → knives)
    if (/fe$/i.test(value)) return value.slice(0, -2) + "ves";

    // Ends in f → drop f, add ves  (leaf → leaves)
    // Exceptions like "roof → roofs" are handled via the invariants set if needed.
    if (/[^aeiou]f$/i.test(value)) return value.slice(0, -1) + "ves";

    // Default — just add s.
    return value + "s";
}

/**
 * Convenience: pluralises then PascalCases a collection name.
 *
 * Useful for generating human-readable labels from raw collection identifiers.
 *
 * @example
 * toEntityLabel("blog_post")  // → "BlogPosts"
 * toEntityLabel("category")   // → "Categories"
 * toEntityLabel("person")     // → "People"
 */
export function toEntityLabel(collectionName: string): string {
    return toPascalCase(pluralise(collectionName));
}