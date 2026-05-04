import { PrismaClient, PlayerRank } from '@prisma/client';

const prisma = new PrismaClient();

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

export class OperatorService {
  private static readonly INITIAL_TOKENS = 1000;
  private static readonly MAX_RANK = PlayerRank.INSTITUCIONAL;

  /**
   * Creates a new operator with guaranteed initial tokens and rank validation
   */
  static async createOperator(data: CreateOperatorData): Promise<OperatorResponse> {
    // Validate email format
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Email inválido é obrigatório');
    }

    // Check if email already exists
    const existingOperator = await prisma.operator.findUnique({
      where: { email: data.email }
    });

    if (existingOperator) {
      throw new Error('Já existe um operador com este email');
    }

    // Set initial rank as INICIANTE (always start from beginning)
    // INSTITUCIONAL is the target objective that can only be achieved through progression
    let rank = PlayerRank.INICIANTE;
    
    // Validate that no rank other than INICIANTE can be set during creation
    if (data.rank && data.rank !== PlayerRank.INICIANTE) {
      throw new Error('Novos operadores sempre começam com rank INICIANTE');
    }

    // Create the operator with guaranteed initial tokens (exactly 1000)
    const operator = await prisma.operator.create({
      data: {
        email: data.email,
        name: data.name,
        rank: rank,
        tokenBalance: this.INITIAL_TOKENS, // Garantido: sempre 1000 tokens
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

  /**
   * Gets an operator by ID
   */
  static async getOperatorById(id: string): Promise<OperatorResponse | null> {
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

  /**
   * Gets an operator by email
   */
  static async getOperatorByEmail(email: string): Promise<OperatorResponse | null> {
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

  /**
   * Lists all operators
   */
  static async listOperators(): Promise<OperatorResponse[]> {
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

  /**
   * Updates operator rank (with validation for INSTITUCIONAL rank)
   */
  static async updateOperatorRank(id: string, newRank: PlayerRank): Promise<OperatorResponse> {
    // Prevent direct assignment to INSTITUCIONAL rank (must be achieved through progression)
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

  /**
   * Validates email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Gets rank hierarchy information
   */
  static getRankHierarchy() {
    return {
      ranks: Object.values(PlayerRank),
      maxRank: this.MAX_RANK,
      initialTokens: this.INITIAL_TOKENS
    };
  }
}
