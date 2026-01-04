import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';

interface CategoryFormProps {
  category?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const iconOptions = [
  { value: '🎯', label: 'Target' },
  { value: '🚀', label: 'Rocket' },
  { value: '✨', label: 'Sparkles' },
  { value: '💰', label: 'Money' },
  { value: '📈', label: 'Chart' },
  { value: '🎓', label: 'Graduate' },
  { value: '💡', label: 'Bulb' },
  { value: '🔥', label: 'Fire' },
  { value: '⭐', label: 'Star' },
  { value: '🏆', label: 'Trophy' },
];

const colorOptions = [
  { value: '#0066cc', label: 'Blu' },
  { value: '#ff6b35', label: 'Arancione' },
  { value: '#00d084', label: 'Verde' },
  { value: '#ff9500', label: 'Arancione Scuro' },
  { value: '#8b5cf6', label: 'Viola' },
  { value: '#ef4444', label: 'Rosso' },
  { value: '#10b981', label: 'Verde Smeraldo' },
  { value: '#f59e0b', label: 'Giallo' },
];

export default function CategoryForm({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      icon: category?.icon || '🎯',
      color: category?.color || '#0066cc',
    }
  });

  const watchedIcon = watch('icon');
  const watchedColor = watch('color');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Categoria</Label>
        <Input
          id="name"
          {...register('name', { required: 'Il nome è obbligatorio' })}
          placeholder="Inserisci il nome della categoria"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descrizione della categoria"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Icona</Label>
          <div className="grid grid-cols-5 gap-2">
            {iconOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('icon', option.value)}
                className={`p-2 text-xl rounded border ${
                  watchedIcon === option.value 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option.value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Colore</Label>
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('color', option.value)}
                className={`w-8 h-8 rounded border-2 ${
                  watchedColor === option.value 
                    ? 'border-gray-900' 
                    : 'border-gray-200'
                }`}
                style={{ backgroundColor: option.value }}
                title={option.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <Label className="text-sm text-muted-foreground">Anteprima</Label>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl">{watchedIcon}</span>
          <div>
            <h4 className="font-medium">{watch('name') || 'Nome Categoria'}</h4>
            <p className="text-sm text-muted-foreground">
              {watch('description') || 'Descrizione della categoria'}
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : category ? 'Aggiorna Categoria' : 'Crea Categoria'}
        </Button>
      </DialogFooter>
    </form>
  );
}