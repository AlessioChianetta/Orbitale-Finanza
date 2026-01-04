
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StickyNote, Save, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CostNoteFieldProps {
  sectionType: string;
  sectionKey: string;
  monthKey: string;
  placeholder?: string;
  className?: string;
  onSave?: (note: string) => void;
}

export function CostNoteField({ 
  sectionType, 
  sectionKey, 
  monthKey, 
  placeholder = "Aggiungi una nota...",
  className = "",
  onSave 
}: CostNoteFieldProps) {
  const [note, setNote] = useState('');
  const [originalNote, setOriginalNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Carica la nota esistente
  useEffect(() => {
    loadNote();
  }, [sectionType, sectionKey, monthKey]);

  // Controlla se ci sono modifiche
  useEffect(() => {
    setHasChanges(note !== originalNote);
  }, [note, originalNote]);

  const loadNote = async () => {
    try {
      const response = await fetch(
        `/api/cost-analysis/cost-notes?sectionType=${sectionType}&monthKey=${monthKey}`
      );
      
      if (response.ok) {
        const notes = await response.json();
        const currentNote = notes[sectionKey] || '';
        setNote(currentNote);
        setOriginalNote(currentNote);
      }
    } catch (error) {
      console.error('Errore nel caricamento della nota:', error);
    }
  };

  const saveNote = async () => {
    setLoading(true);
    
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
          notes: note.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Errore nel salvataggio');
      }

      setOriginalNote(note);
      setHasChanges(false);
      onSave?.(note);
      
      toast({
        title: "Nota salvata",
        description: "La nota è stata salvata con successo.",
      });

    } catch (error) {
      console.error('Errore nel salvataggio della nota:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvataggio della nota.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/cost-analysis/cost-notes?sectionType=${sectionType}&sectionKey=${sectionKey}&monthKey=${monthKey}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione');
      }

      setNote('');
      setOriginalNote('');
      setHasChanges(false);
      
      toast({
        title: "Nota eliminata",
        description: "La nota è stata eliminata con successo.",
      });

    } catch (error) {
      console.error('Errore nell\'eliminazione della nota:', error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione della nota.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <StickyNote className="w-4 h-4" />
        <span>Note per {sectionKey}</span>
      </div>
      
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={loading}
      />
      
      {(hasChanges || note.trim()) && (
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              onClick={saveNote}
              disabled={loading}
              size="sm"
              className="flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Salva
            </Button>
          )}
          
          {note.trim() && (
            <Button
              onClick={deleteNote}
              disabled={loading}
              size="sm"
              variant="outline"
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
              Elimina
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
