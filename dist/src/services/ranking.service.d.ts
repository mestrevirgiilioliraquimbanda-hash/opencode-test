import { PlayerRank } from '@prisma/client';
export interface PlayerRankingData {
    playerId: string;
    playerName: string | null;
    currentRank: PlayerRank;
    totalVolume: number;
    arenaVolumes: Record<string, number>;
    achievedRanks: PlayerRank[];
    nextRankProgress: {
        rank: PlayerRank;
        currentVolume: number;
        requiredVolume: number;
        progressPercentage: number;
    } | null;
}
export interface RankingThresholds {
    [key: string]: {
        INICIANTE: number;
        AVANCADO: number;
        BIG_PLAYER: number;
        INSTITUCIONAL: number;
    };
}
export declare class RankingService {
    private static readonly RANK_THRESHOLDS;
    static analyzePlayerRanking(playerId: string): Promise<PlayerRankingData>;
    static checkInstitucionalStatus(playerId: string, arenaIds?: string[]): Promise<{
        isInstitucional: boolean;
        institutionalArenas: string[];
        totalInstitutionalArenas: number;
        requiredArenas: number;
    }>;
    static getGlobalRanking(limit?: number): Promise<PlayerRankingData[]>;
    private static calculateAchievedRanks;
    private static determineRankByVolume;
    private static calculateNextRankProgress;
    static getArenaThresholds(arenaId: string): RankingThresholds[string] | null;
    static canPromoteToInstitucional(playerId: string): Promise<{
        canPromote: boolean;
        missingArenas: string[];
        currentStatus: string;
    }>;
}
