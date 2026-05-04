import { PlayerRank } from '@prisma/client';
export interface CreateOperatorData {
    email: string;
    name?: string | null;
    rank?: PlayerRank;
}
export interface OperatorResponse {
    id: string;
    email: string;
    name: string | null;
    rank: PlayerRank;
    tokenBalance: number;
    reputationScore: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class OperatorService {
    private static readonly INITIAL_TOKENS;
    private static readonly MAX_RANK;
    static createOperator(data: CreateOperatorData): Promise<OperatorResponse>;
    static getOperatorById(id: string): Promise<OperatorResponse | null>;
    static getOperatorByEmail(email: string): Promise<OperatorResponse | null>;
    static listOperators(): Promise<OperatorResponse[]>;
    static updateOperatorRank(id: string, newRank: PlayerRank): Promise<OperatorResponse>;
    private static isValidEmail;
    static getRankHierarchy(): {
        ranks: ("INICIANTE" | "AVANCADO" | "BIG_PLAYER" | "INSTITUCIONAL")[];
        maxRank: "INSTITUCIONAL";
        initialTokens: number;
    };
}
