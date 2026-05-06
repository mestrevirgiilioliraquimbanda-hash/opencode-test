import { ChartComponent } from './ChartComponent';

function App() {
  return (
    <div className="flex flex-col h-screen bg-[#0c0d10] text-gray-300 font-sans overflow-hidden">
      
      {/* BARRA SUPERIOR */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#131722] border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tighter text-white">
            AUREX <span className="text-green-500">AUREX-ARENA-TESTE</span>
          </h1>
        </div>
        <div className="text-xs font-medium uppercase text-green-500">
          AUR / USD: 1.2615 (+0.42%)
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* GRÁFICO (Onde o erro é resolvido) */}
        <section className="flex-1 flex flex-col border-r border-gray-800">
          <div className="flex-1 bg-[#0c0d10]">
             {/* AQUI ESTÁ O USO DO COMPONENTE QUE LIMPA O ERRO */}
             <ChartComponent />
          </div>
          
          <div className="h-32 bg-[#0c0d10] p-2 flex items-end gap-1 border-t border-gray-900">
             {[...Array(40)].map((_, i) => (
               <div key={i} className="flex-1 bg-green-500/20 h-full" style={{ height: `${Math.random() * 80}%` }}></div>
             ))}
          </div>
        </section>

        {/* LATERAL ECN COM BOTÕES */}
        <aside className="w-80 bg-[#131722] flex flex-col p-4">
          <h2 className="text-xs font-bold uppercase text-gray-400 mb-4">Volume por Preço</h2>
          
          <div className="flex-1 overflow-hidden opacity-50 text-[10px]">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <span className="w-10 text-gray-500">1.26{15-i}</span>
                <div className="bg-red-500/30 h-2" style={{ width: `${Math.random() * 100}%` }}></div>
              </div>
            ))}
          </div>

          {/* PAINEL DE OPERAÇÃO DO JOGADOR INSTITUCIONAL */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button className="bg-green-600 hover:bg-green-500 text-white py-4 rounded font-bold uppercase text-xs transition-colors">
              Comprar
            </button>
            <button className="bg-red-600 hover:bg-red-500 text-white py-4 rounded font-bold uppercase text-xs transition-colors">
              Vender
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;