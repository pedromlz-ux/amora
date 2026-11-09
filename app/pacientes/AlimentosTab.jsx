'use client';
import React, { useState, useEffect } from 'react';

export default function AlimentosTab({ supabase, token }) {
  const [activeDb, setActiveDb] = useState('taco'); // 'taco', 'tbca', 'custom'
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [description, setDescription] = useState('');
  const [energy, setEnergy] = useState('');
  const [carb, setCarb] = useState('');
  const [protein, setProtein] = useState('');
  const [lipid, setLipid] = useState('');

  // Portion/measure state
  const [portionType, setPortionType] = useState('100g'); // '100g', 'grams', 'measure'
  const [portionWeight, setPortionWeight] = useState('100');
  const [measureName, setMeasureName] = useState('');

  // Fetch foods based on active tab and search query
  useEffect(() => {
    async function fetchFoods() {
      setLoading(true);
      try {
        if (activeDb === 'custom') {
          // Fetch from custom_foods
          let query = supabase.from('custom_foods').select('*').order('created_at', { ascending: false });
          if (searchTerm.trim().length >= 2) {
            query = query.ilike('description', `%${searchTerm.trim()}%`);
          }
          const { data, error } = await query;
          if (!error && data) {
            setFoods(data);
          }
        } else {
          // Fetch from TACO/TBCA API
          const q = searchTerm.trim();
          let url = `/api/alimentos?db=${activeDb}`;
          if (q.length >= 2) {
            url += `&q=${encodeURIComponent(q)}`;
          }
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setFoods(data);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar alimentos:', err);
      }
      setLoading(false);
    }

    const delayDebounce = setTimeout(() => {
      fetchFoods();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [activeDb, searchTerm, supabase]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingFood(null);
    setDescription('');
    setEnergy('');
    setCarb('');
    setProtein('');
    setLipid('');
    setPortionType('100g');
    setPortionWeight('100');
    setMeasureName('');
    setShowModal(true);
  };

  const handleOpenEdit = (food) => {
    setIsEditing(true);
    setEditingFood(food);
    setDescription(food.description);
    setEnergy(food.energy_kcal);
    setCarb(food.carbohydrate_g);
    setProtein(food.protein_g);
    setLipid(food.lipid_g);
    setPortionType('100g');
    setPortionWeight('100');
    setMeasureName('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('A descrição é obrigatória.');
      return;
    }

    const weightVal = parseFloat(portionWeight) || 100;
    const factor = 100 / weightVal;

    let finalDescription = description.trim();
    if (portionType === 'measure' && measureName.trim()) {
      const formattedMeasure = `(1 ${measureName.trim()})`;
      if (!finalDescription.toLowerCase().includes(measureName.toLowerCase().trim())) {
        finalDescription = `${finalDescription} ${formattedMeasure}`;
      }
    }

    const payload = {
      description: finalDescription,
      energy_kcal: (parseFloat(energy) || 0) * factor,
      carbohydrate_g: (parseFloat(carb) || 0) * factor,
      protein_g: (parseFloat(protein) || 0) * factor,
      lipid_g: (parseFloat(lipid) || 0) * factor,
    };

    try {
      if (isEditing && editingFood) {
        // Update
        const { error } = await supabase
          .from('custom_foods')
          .update(payload)
          .eq('id', editingFood.id);

        if (error) throw error;
        alert('Alimento atualizado com sucesso!');
      } else {
        // Create
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('custom_foods')
          .insert({ ...payload, user_id: user.id });

        if (error) throw error;
        alert('Alimento cadastrado com sucesso!');
      }

      setShowModal(false);
      // Refresh custom foods
      if (activeDb === 'custom') {
        const { data } = await supabase.from('custom_foods').select('*').order('created_at', { ascending: false });
        if (data) setFoods(data);
      } else {
        setActiveDb('custom'); // redirect to custom tab to see the new/updated food
      }
    } catch (err) {
      console.error('Erro ao salvar alimento:', err);
      alert('Erro ao salvar alimento.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza de que deseja excluir este alimento?')) return;
    try {
      const { error } = await supabase.from('custom_foods').delete().eq('id', id);
      if (error) throw error;
      setFoods(prev => prev.filter(f => f.id !== id));
      alert('Alimento excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir alimento:', err);
      alert('Erro ao excluir alimento.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tabelas Alimentares</h2>
          <p className="text-sm text-gray-500">Consulte alimentos das tabelas TACO e TBCA ou gerencie seus próprios alimentos cadastrados.</p>
        </div>
        {activeDb === 'custom' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-sm text-sm shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Novo Alimento
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-[#27272A] gap-4">
        <button
          onClick={() => { setActiveDb('taco'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeDb === 'taco' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Tabela TACO
        </button>
        <button
          onClick={() => { setActiveDb('tbca'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeDb === 'tbca' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Tabela TBCA
        </button>
        <button
          onClick={() => { setActiveDb('custom'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeDb === 'custom' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          Meus Alimentos
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
        <input
          type="text"
          placeholder="Buscar alimentos por descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white"
        />
      </div>

      {/* Food Table */}
      {loading ? (
        <div className="p-8 flex justify-center text-gray-500">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : foods.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500 bg-white dark:bg-[#18181B] rounded-2xl border border-gray-200 dark:border-[#27272A]">
          <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">nutrition</span>
          <p>Nenhum alimento encontrado para essa busca.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm dark:text-white">
              <thead className="bg-gray-50 dark:bg-[#111113] text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-4 font-semibold">Alimento</th>
                  <th className="p-4 font-semibold text-center">Calorias (100g)</th>
                  <th className="p-4 font-semibold text-center">Carbos (100g)</th>
                  <th className="p-4 font-semibold text-center">Proteínas (100g)</th>
                  <th className="p-4 font-semibold text-center">Gorduras (100g)</th>
                  {activeDb === 'custom' && <th className="p-4 font-semibold text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#27272A]">
                {foods.map((food) => (
                  <tr key={food.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1f1f23]/50 transition-colors">
                    <td className="p-4 font-bold">{food.description}</td>
                    <td className="p-4 text-center font-medium">{parseFloat(food.energy_kcal || 0).toFixed(0)} kcal</td>
                    <td className="p-4 text-center text-blue-600 dark:text-blue-400 font-medium">{parseFloat(food.carbohydrate_g || 0).toFixed(1)}g</td>
                    <td className="p-4 text-center text-green-600 dark:text-green-400 font-medium">{parseFloat(food.protein_g || 0).toFixed(1)}g</td>
                    <td className="p-4 text-center text-yellow-600 dark:text-yellow-400 font-medium">{parseFloat(food.lipid_g || 0).toFixed(1)}g</td>
                    {activeDb === 'custom' && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(food)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                            title="Editar Alimento"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(food.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Excluir Alimento"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-gray-200 dark:border-[#27272A] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-200 dark:border-[#27272A] flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {isEditing ? 'Editar Alimento' : 'Novo Alimento'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Descrição / Nome do Alimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Whey Protein Isolado, Iogurte Natural Desnatado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white"
                />
              </div>

              {/* Portion Type Selector */}
              <div className="bg-gray-50 dark:bg-[#111113] p-4 rounded-xl border border-gray-200 dark:border-[#27272A] space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Referência dos macros digitados</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setPortionType('100g'); setPortionWeight('100'); }}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${portionType === '100g' ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white dark:bg-black border-gray-200 dark:border-[#27272A] text-gray-700 dark:text-gray-300'}`}
                  >
                    100g (Padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPortionType('grams'); setPortionWeight('30'); }}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${portionType === 'grams' ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white dark:bg-black border-gray-200 dark:border-[#27272A] text-gray-700 dark:text-gray-300'}`}
                  >
                    Outro Peso (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPortionType('measure'); setPortionWeight('30'); }}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all ${portionType === 'measure' ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'bg-white dark:bg-black border-gray-200 dark:border-[#27272A] text-gray-700 dark:text-gray-300'}`}
                  >
                    Medida Caseira
                  </button>
                </div>

                {portionType === 'grams' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Peso da porção (g)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 30"
                      value={portionWeight}
                      onChange={(e) => setPortionWeight(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white"
                    />
                  </div>
                )}

                {portionType === 'measure' && (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nome da Medida</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: scoop, colher, fatia"
                        value={measureName}
                        onChange={(e) => setMeasureName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Peso da Medida (g)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ex: 30"
                        value={portionWeight}
                        onChange={(e) => setPortionWeight(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Calorias (kcal)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={energy}
                    onChange={(e) => setEnergy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Carboidratos (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={carb}
                    onChange={(e) => setCarb(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Proteínas (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white text-green-600 dark:text-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Gorduras (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={lipid}
                    onChange={(e) => setLipid(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#27272A] rounded-xl focus:ring-2 focus:ring-purple-600 outline-none text-sm dark:text-white text-yellow-600 dark:text-yellow-400"
                  />
                </div>
              </div>

              {portionType !== '100g' && (
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl text-xs text-purple-700 dark:text-purple-400 mt-2 border border-purple-100 dark:border-purple-900/20">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calculate</span>
                    Equivalente calculado para 100g (a ser salvo):
                  </p>
                  <div className="grid grid-cols-4 gap-2 font-mono text-center mt-1">
                    <div className="bg-white dark:bg-black/40 p-1.5 rounded">
                      <p className="font-bold">Kcal</p>
                      <p>{((parseFloat(energy) || 0) * (100 / (parseFloat(portionWeight) || 100))).toFixed(0)}</p>
                    </div>
                    <div className="bg-white dark:bg-black/40 p-1.5 rounded text-blue-600 dark:text-blue-400">
                      <p className="font-bold">Carb</p>
                      <p>{((parseFloat(carb) || 0) * (100 / (parseFloat(portionWeight) || 100))).toFixed(1)}g</p>
                    </div>
                    <div className="bg-white dark:bg-black/40 p-1.5 rounded text-green-600 dark:text-green-400">
                      <p className="font-bold">Prot</p>
                      <p>{((parseFloat(protein) || 0) * (100 / (parseFloat(portionWeight) || 100))).toFixed(1)}g</p>
                    </div>
                    <div className="bg-white dark:bg-black/40 p-1.5 rounded text-yellow-600 dark:text-yellow-400">
                      <p className="font-bold">Gord</p>
                      <p>{((parseFloat(lipid) || 0) * (100 / (parseFloat(portionWeight) || 100))).toFixed(1)}g</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-[#27272A] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors text-sm shadow-sm"
                >
                  Salvar Alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
