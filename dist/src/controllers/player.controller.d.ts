export declare class PlayerController {
    getPlayerProfile(): Promise<{
        success: boolean;
        data: {
            profile: {
                id: string;
                email: string;
                name: string;
                rank: import(".prisma/client").$Enums.PlayerRank;
                tokenBalance: number;
                reputationScore: number;
                createdAt: Date;
                updatedAt: Date;
            };
            clan: {
                id: string;
                name: string;
                reputationScore: number;
            };
            ownedClans: {
                id: string;
                createdAt: Date;
                name: string;
                reputationScore: number;
            }[];
            recentTransactions: {
                id: string;
                arenaId: string;
                transactionAmount: number;
                arenaPrice: number;
                createdAt: Date;
            }[];
            arenaVolumes: Record<string, number>;
            totalTransactions: number;
            totalVolume: number;
        };
    }>;
    getPlayerRanking(): Promise<{
        success: boolean;
        data: {
            playerId: string;
            playerName: string;
            currentRank: import(".prisma/client").$Enums.PlayerRank;
            ranking: import("../services/ranking.service.js").PlayerRankingData;
            institucionalStatus: {
                isInstitucional: boolean;
                institutionalArenas: string[];
                totalInstitutionalArenas: number;
                requiredArenas: number;
            };
            promotionCheck: {
                canPromote: boolean;
                missingArenas: string[];
                currentStatus: string;
            };
            globalPosition: number;
            isInTopRanking: boolean;
        };
    }>;
    getArenaProgress(): Promise<{
        success: boolean;
        data: {
            playerId: string;
            playerName: string;
            arenaProgress: {
                arenaId: string;
                currentVolume: number;
                thresholds: any;
                currentRank: string;
                nextRankProgress?: any;
            }[];
        };
    }>;
    getPlayerTransactions(): Promise<{
        success: boolean;
        data: {
            playerId: string;
            playerName: string;
            transactions: {
                id: string;
                arenaId: string;
                transactionAmount: number;
                arenaPrice: number;
                createdAt: Date;
            }[];
            count: number;
            totalVolume: number;
        };
    }>;
}
