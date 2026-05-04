import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Wallet, TrendingUp } from 'lucide-react';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Conecta no seu backend NestJS (porta 3005)
        const response = await axios.get('http://localhost:3005/api/player/ranking');
        setData(response.data.data);
      } catch (error) {
        console.error("Erro ao buscar dados do ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] text-emerald-500 flex items-center justify-center font-mono">
      INICIALIZANDO HUD_SYSTEM...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans p-8">
      <div className="max-w-4xl mx-auto border border-emerald-500/20 bg-emerald-500/5 p-6 rounded-xl backdrop-blur-md shadow-2xl shadow-emerald-500/10">
        
        {/* Cabeçalho do Player */}
        <div className="flex justify-between items-center mb-8 border-b border-emerald-500/10 pb-6">
          <div>
            <h1 className="text-xs uppercase tracking-[0.4em] text-emerald-500/60 mb-1">Authenticated Player</h1>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
              {data?.playerName || 'aurex-data-player'}
            </h2>
          </div>
          <div className="text-right">
            <span className="px-4 py-1.5 rounded-sm border border-emerald-500 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {data?.currentRank || 'INICIANTE'}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Volume de Tokens */}
          <div className="bg-gradient-to-br from-white/10 to-transparent p-5 rounded-lg border border-white/5 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center gap-3 mb-3 text-emerald-500">
              <Wallet size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Volume</span>
            </div>
            <p className="text-3xl font-mono font-bold tracking-tighter">
              {data?.totalVolume?.toLocaleString() || '19.003'}
              <span className="text-xs text-emerald-500/50 ml-2">ATK</span>
            </p>
          </div>

          {/* Ranking Global */}
          <div className="bg-gradient-to-br from-white/10 to-transparent p-5 rounded-lg border border-white/5">
            <div className="flex items-center gap-3 mb-3 text-blue-400">
              <TrendingUp size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Global Rank</span>
            </div>
            <p className="text-3xl font-mono font-bold tracking-tighter">#001</p>
          </div>

          {/* Status do Projeto */}
          <div className="bg-gradient-to-br from-white/10 to-transparent p-5 rounded-lg border border-white/5">
            <div className="flex items-center gap-3 mb-3 text-purple-400">
              <Trophy size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Level Phase</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-tight text-gray-400">
              Institucional Player <br />
              <span className="text-xs font-normal text-purple-400/60 leading-none">Em Desenvolvimento</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;