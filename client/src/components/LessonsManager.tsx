import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Video, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Youtube,
  Play,
  Loader2
} from 'lucide-react';

interface LessonsManagerProps {
  courseId: number;
  courseName: string;
  categories: any[];
}

// Helper function to detect video type
const detectVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'direct';
};

// Helper function to extract video ID
const extractVideoId = (url: string, type: 'youtube' | 'vimeo') => {
  if (type === 'youtube') {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }
  if (type === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }
  return null;
};

export default function LessonsManager({ courseId, courseName, categories }: LessonsManagerProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    sortOrder: '',
    categoryId: '',
    isPublished: false
  });

  // Fetch lessons for the course
  const { data: lessons = [], isLoading, refetch } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/courses/${courseId}/lessons`);
      if (!response.ok) throw new Error('Failed to fetch lessons');
      return response.json();
    },
    enabled: !!courseId,
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const videoType = detectVideoType(lessonData.videoUrl);
      const response = await fetch(`/api/admin/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lessonData,
          videoType,
          duration: parseInt(lessonData.duration) || 0,
          sortOrder: parseInt(lessonData.sortOrder) || 0,
          categoryId: lessonData.categoryId ? parseInt(lessonData.categoryId) : null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create lesson');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Lezione creata con successo" });
    },
    onError: (error) => {
      toast({ 
        title: "Errore", 
        description: "Impossibile creare la lezione", 
        variant: "destructive" 
      });
    }
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, ...lessonData }: any) => {
      const videoType = detectVideoType(lessonData.videoUrl);
      const response = await fetch(`/api/admin/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lessonData,
          videoType,
          duration: parseInt(lessonData.duration) || 0,
          sortOrder: parseInt(lessonData.sortOrder) || 0,
          categoryId: lessonData.categoryId ? parseInt(lessonData.categoryId) : null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update lesson');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Lezione aggiornata con successo" });
    },
    onError: (error) => {
      toast({ 
        title: "Errore", 
        description: "Impossibile aggiornare la lezione", 
        variant: "destructive" 
      });
    }
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete lesson');
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Lezione eliminata con successo" });
    },
    onError: (error) => {
      toast({ 
        title: "Errore", 
        description: "Impossibile eliminare la lezione", 
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      duration: '',
      sortOrder: '',
      categoryId: '',
      isPublished: false
    });
    setEditingLesson(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (lesson: any) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration?.toString() || '',
      sortOrder: lesson.sortOrder?.toString() || '',
      categoryId: lesson.categoryId?.toString() || '',
      isPublished: lesson.isPublished || false
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      toast({ 
        title: "Errore", 
        description: "Titolo e URL video sono obbligatori", 
        variant: "destructive" 
      });
      return;
    }

    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, ...formData });
    } else {
      createLessonMutation.mutate(formData);
    }
  };

  const getVideoIcon = (videoType: string) => {
    switch (videoType) {
      case 'youtube':
        return <Youtube className="h-3 w-3 text-red-500" />;
      case 'vimeo':
        return <Play className="h-3 w-3 text-blue-500" />;
      default:
        return <Video className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Gestione Lezioni - {courseName}
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Lezione
          </Button>
        </CardTitle>
        <CardDescription>
          Gestisci le lezioni video per questo corso (YouTube, Vimeo, ecc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
              </div>
            ))
          ) : lessons.length > 0 ? (
            lessons.map((lesson: any) => (
              <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{lesson.title}</h3>
                    {lesson.videoUrl && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {getVideoIcon(lesson.videoType)}
                        {lesson.videoType?.toUpperCase() || 'VIDEO'}
                      </Badge>
                    )}
                    {lesson.categoryId && (
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.id === lesson.categoryId)?.name || 'Categoria'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{lesson.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Durata: {lesson.duration || 0} min</span>
                    <span>Ordine: {lesson.sortOrder || 0}</span>
                    {lesson.isPublished ? (
                      <Badge variant="default" className="text-xs">Pubblicata</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Bozza</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {lesson.videoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(lesson.videoUrl, '_blank')}
                      title="Visualizza video"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(lesson)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteLessonMutation.mutate(lesson.id)}
                    disabled={deleteLessonMutation.isPending}
                  >
                    {deleteLessonMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nessuna lezione trovata</p>
              <p className="text-sm">Clicca su "Aggiungi Lezione" per creare la prima lezione di questo corso</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Modifica Lezione' : 'Nuova Lezione'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Modifica i dettagli della lezione' : 'Crea una nuova lezione video per il corso'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titolo Lezione *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Inserisci il titolo della lezione"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrivi il contenuto della lezione"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="videoUrl">URL Video (YouTube/Vimeo) *</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                required
              />
              {formData.videoUrl && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  {getVideoIcon(detectVideoType(formData.videoUrl))}
                  Tipo rilevato: {detectVideoType(formData.videoUrl).toUpperCase()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Durata (minuti)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="sortOrder">Ordine</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
              <Label htmlFor="published">Pubblica lezione</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
              >
                {(createLessonMutation.isPending || updateLessonMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingLesson ? 'Aggiorna' : 'Crea'} Lezione
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}