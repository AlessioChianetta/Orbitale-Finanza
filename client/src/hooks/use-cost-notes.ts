
import { useState, useEffect } from 'react';

interface CostNotesHook {
  notes: { [key: string]: string };
  saveNote: (sectionKey: string, noteText: string) => Promise<void>;
  deleteNote: (sectionKey: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useCostNotes(sectionType: string, monthKey: string): CostNotesHook {
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica le note quando cambiano sectionType o monthKey
  useEffect(() => {
    if (sectionType && monthKey) {
      loadNotes();
    }
  }, [sectionType, monthKey]);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/cost-analysis/cost-notes?sectionType=${sectionType}&monthKey=${monthKey}`
      );
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle note');
      }
      
      const notesData = await response.json();
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      console.error('Errore caricamento note:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async (sectionKey: string, noteText: string) => {
    setError(null);
    
    try {
      const response = await fetch('/api/cost-analysis/cost-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionType,
          sectionKey,
          monthKey,
          notes: noteText
        })
      });

      if (!response.ok) {
        throw new Error('Errore nel salvataggio della nota');
      }

      // Aggiorna lo stato locale
      setNotes(prev => ({
        ...prev,
        [sectionKey]: noteText
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio');
      throw err;
    }
  };

  const deleteNote = async (sectionKey: string) => {
    setError(null);
    
    try {
      const response = await fetch(
        `/api/cost-analysis/cost-notes?sectionType=${sectionType}&sectionKey=${sectionKey}&monthKey=${monthKey}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione della nota');
      }

      // Rimuovi dallo stato locale
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[sectionKey];
        return newNotes;
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione');
      throw err;
    }
  };

  return {
    notes,
    saveNote,
    deleteNote,
    loading,
    error
  };
}
