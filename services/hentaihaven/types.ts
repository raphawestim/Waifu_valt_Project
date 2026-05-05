export interface HHAnime {
    id: string;
    title: string;
    url: string;
    coverImage: string;
    rating: number; // 0-5
    episodes: HHEpisode[];
}

export interface HHEpisode {
    title: string;
    url: string;
    thumbnail: string;
}

export interface HHSearchResponse {
    results: HHAnime[];
    currentPage: number;
    totalPages: number;
}

export interface HHEpisodeResponse {
    results: HHEpisode[];
    currentPage: number;
    totalPages: number;
}
