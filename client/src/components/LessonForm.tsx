import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, Video, ExternalLink } from 'lucide-react';

interface LessonFormProps {
  lesson?: any;
  courseId: number;
  categories: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function LessonForm({ lesson, courseId, categories, onSubmit, onCancel, isLoading }: LessonFormProps) {
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<'youtube' | 'vimeo' | 'direct'>('youtube');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: lesson?.title || '',
      description: lesson?.description || '',
      videoUrl: lesson?.videoUrl || '',
      videoType: lesson?.videoType || 'youtube',
      categoryId: lesson?.categoryId || '',
      duration: lesson?.duration || 0,
      sortOrder: lesson?.sortOrder || 0,
      textContent: lesson?.textContent || '',
      isPublished: lesson?.isPublished || false,
    }
  });

  const watchedVideoUrl = watch('videoUrl');
  const watchedVideoType = watch('videoType');

  useEffect(() => {
    if (watchedVideoUrl) {
      detectVideoType(watchedVideoUrl);
    }
  }, [watchedVideoUrl]);

  const detectVideoType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setVideoType('youtube');
      setValue('videoType', 'youtube');
      
      // Extract video ID for preview
      const videoId = extractYouTubeId(url);
      if (videoId) {
        setVideoPreview(`https://www.youtube.com/embed/${videoId}`);
      }
    } else if (url.includes('vimeo.com')) {
      setVideoType('vimeo');
      setValue('videoType', 'vimeo');
      
      // Extract video ID for preview
      const videoId = extractVimeoId(url);
      if (videoId) {
        setVideoPreview(`https://player.vimeo.com/video/${videoId}`);
      }
    } else if (url.startsWith('http')) {
      setVideoType('direct');
      setValue('videoType', 'direct');
      setVideoPreview(url);
    } else {
      setVideoPreview(null);
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractVimeoId = (url: string): string | null => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const onFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      courseId,
      categoryId: data.categoryId && data.categoryId !== 'none' ? parseInt(data.categoryId) : null,
      duration: parseInt(data.duration) || 0,
      sortOrder: parseInt(data.sortOrder) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titolo Lezione</Label>
          <Input
            id="title"
            {...register('title', { required: 'Il titolo è obbligatorio' })}
            placeholder="Inserisci il titolo della lezione"
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <Select onValueChange={(value) => setValue('categoryId', value)} defaultValue={lesson?.categoryId?.toString()}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessuna categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center gap-2">
                    {category.icon && <span>{category.icon}</span>}
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descrizione della lezione"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="videoUrl">Link Video</Label>
          <div className="flex gap-2">
            <Input
              id="videoUrl"
              {...register('videoUrl')}
              placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
              className="flex-1"
            />
            <Select onValueChange={(value) => setValue('videoType', value)} defaultValue={watchedVideoType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </div>
                </SelectItem>
                <SelectItem value="vimeo">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Vimeo
                  </div>
                </SelectItem>
                <SelectItem value="direct">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Diretto
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Supporta YouTube, Vimeo e link diretti a video. Il tipo verrà rilevato automaticamente.
          </p>
        </div>

        {videoPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Anteprima Video</CardTitle>
              <CardDescription>
                <Badge variant="outline">
                  {videoType === 'youtube' && 'YouTube'}
                  {videoType === 'vimeo' && 'Vimeo'}
                  {videoType === 'direct' && 'Video Diretto'}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(videoType === 'youtube' || videoType === 'vimeo') ? (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={videoPreview}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video src={videoPreview} controls className="w-full h-full" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Durata (minuti)</Label>
          <Input
            id="duration"
            type="number"
            {...register('duration')}
            placeholder="0"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Ordine</Label>
          <Input
            id="sortOrder"
            type="number"
            {...register('sortOrder')}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="textContent">Contenuto Testuale</Label>
        <Textarea
          id="textContent"
          {...register('textContent')}
          placeholder="Contenuto testuale aggiuntivo per la lezione"
          rows={6}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublished"
          {...register('isPublished')}
          defaultChecked={lesson?.isPublished}
          onCheckedChange={(checked) => setValue('isPublished', checked)}
        />
        <Label htmlFor="isPublished">Pubblica lezione</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : lesson ? 'Aggiorna Lezione' : 'Crea Lezione'}
        </Button>
      </DialogFooter>
    </form>
  );
}