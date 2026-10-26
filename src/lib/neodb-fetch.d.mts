export declare const SHELF_TYPES: readonly ["complete", "progress", "wishlist", "dropped"];
export declare const VOLATILE_FIELDS: readonly string[];
export declare function fetchLibraryFromNeoDB(opts: { base: string; token: string; siteUrl: string }): Promise<unknown[]>;
export declare function fingerprint(items: unknown[]): string;
