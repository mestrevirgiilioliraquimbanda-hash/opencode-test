"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class OperatorService {
    static async createOperator(data) {
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Email inválido é obrigatório');
        }
        const existingOperator = await prisma.operator.findUnique({
            where: { email: data.email }
        });
        if (existingOperator) {
            throw new Error('Já existe um operador com este email');
        }
        let rank = client_1.PlayerRank.INICIANTE;
        if (data.rank && data.rank !== client_1.PlayerRank.INICIANTE) {
            throw new Error('Novos operadores sempre começam com rank INICIANTE');
        }
        const operator = await prisma.operator.create({
            data: {
                email: data.email,
                name: data.name,
                rank: rank,
                tokenBalance: this.INITIAL_TOKENS,
                reputationScore: 0.0
            }
        });
        return {
            id: operator.id,
            email: operator.email,
            name: operator.name,
            rank: operator.rank,
            tokenBalance: operator.tokenBalance,
            reputationScore: operator.reputationScore,
            createdAt: operator.createdAt,
            updatedAt: operator.updatedAt
        };
    }
    static async getOperatorById(id) {
        const operator = await prisma.operator.findUnique({
            where: { id }
        });
        if (!operator) {
            return null;
        }
        return {
            id: operator.id,
            email: operator.email,
            name: operator.name,
            rank: operator.rank,
            tokenBalance: operator.tokenBalance,
            reputationScore: operator.reputationScore,
            createdAt: operator.createdAt,
            updatedAt: operator.updatedAt
        };
    }
    static async getOperatorByEmail(email) {
        const operator = await prisma.operator.findUnique({
            where: { email }
        });
        if (!operator) {
            return null;
        }
        return {
            id: operator.id,
            email: operator.email,
            name: operator.name,
            rank: operator.rank,
            tokenBalance: operator.tokenBalance,
            reputationScore: operator.reputationScore,
            createdAt: operator.createdAt,
            updatedAt: operator.updatedAt
        };
    }
    static async listOperators() {
        const operators = await prisma.operator.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return operators.map(operator => ({
            id: operator.id,
            email: operator.email,
            name: operator.name,
            rank: operator.rank,
            tokenBalance: operator.tokenBalance,
            reputationScore: operator.reputationScore,
            createdAt: operator.createdAt,
            updatedAt: operator.updatedAt
        }));
    }
    static async updateOperatorRank(id, newRank) {
        if (newRank === this.MAX_RANK) {
            throw new Error('O rank INSTITUCIONAL só pode ser alcançado através de progressão no jogo');
        }
        const operator = await prisma.operator.update({
            where: { id },
            data: { rank: newRank }
        });
        return {
            id: operator.id,
            email: operator.email,
            name: operator.name,
            rank: operator.rank,
            tokenBalance: operator.tokenBalance,
            reputationScore: operator.reputationScore,
            createdAt: operator.createdAt,
            updatedAt: operator.updatedAt
        };
    }
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static getRankHierarchy() {
        return {
            ranks: Object.values(client_1.PlayerRank),
            maxRank: this.MAX_RANK,
            initialTokens: this.INITIAL_TOKENS
        };
    }
}
exports.OperatorService = OperatorService;
OperatorService.INITIAL_TOKENS = 1000;
OperatorService.MAX_RANK = client_1.PlayerRank.INSTITUCIONAL;
//# sourceMappingURL=operator.service.js.map