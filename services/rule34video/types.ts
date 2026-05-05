export interface R34VideoSearchResult {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: string;
    views?: string;
    rating?: string;
}

export interface R34VideoTag {
    id: string;
    name: string;
    url: string;
}

export interface R34VideoDetails {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: string;
    views: string;
    rating: string;
    uploadDate: string;
    description: string;
    tags: R34VideoTag[];
    mp4Url?: string; // direct mp4 url if available
}

export interface R34VideoResponse {
    results: R34VideoSearchResult[];
    currentPage: number;
    totalPages: number;
}
