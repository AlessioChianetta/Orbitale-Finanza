import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Lock, 
  Search, 
  Clock, 
  Video,
  Filter
} from 'lucide-react';

// Helper function for YouTube video ID extraction
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface VideoLessonsGridProps {
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  selectedCourse: number | null;
  setSelectedCourse: (id: number | null) => void;
  selectedLesson: any;
  setSelectedLesson: (lesson: any) => void;
  categories: any[];
}

export default function VideoLessonsGrid({
  selectedCategory,
  setSelectedCategory,
  selectedCourse,
  setSelectedCourse,
  selectedLesson,
  setSelectedLesson,
  categories
}: VideoLessonsGridProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch lessons for the selected course
  const { data: courseLessons = [], isLoading: courseLessonsLoading } = useQuery({
    queryKey: ['/api/admin/courses', selectedCourse, 'lessons'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/courses/${selectedCourse}/lessons`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch course lessons:', response.status, response.statusText);
        return [];
      }
      return response.json();
    },
    enabled: !!selectedCourse,
    select: (data) => data || []
  });

  console.log('courseLessons:', courseLessons);
  console.log('selectedCourse:', selectedCourse);
  console.log('selectedCategory:', selectedCategory);
  console.log('courseLessonsLoading:', courseLessonsLoading);

  // Filter lessons based on search term and selected category
  const filteredLessons = courseLessons.filter((lesson: any) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || lesson.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  console.log('Filtered lessons:', filteredLessons);

  const isLessonLocked = (lesson: any) => {
    return false;
  };

  if (!selectedCourse) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Seleziona un corso per iniziare</h2>
          <p className="text-gray-400">Scegli un corso dalla sezione "I tuoi Corsi" per visualizzare le lezioni disponibili.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 p-6 bg-gray-800/50 backdrop-blur border-r border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">Filtri Corso</h3>
          
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca lezioni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Course Categories */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Categorie
            </h4>
            
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Tutte le Lezioni</div>
                    <div className="text-xs opacity-70">{courseLessons.length} lezioni</div>
                  </div>
                </div>
              </button>
              
              {categories && categories.filter ? categories.filter((category: any) => category.courseId === selectedCourse).map((category: any, index: number) => {
                const categoryLessons = courseLessons.filter((lesson: any) => lesson.categoryId === category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-xs opacity-70">{categoryLessons.length} lezioni</div>
                      </div>
                    </div>
                  </button>
                );
              }) : null}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Lezioni del Corso</h2>
                <p className="text-gray-400 mt-1">
                  {filteredLessons.length} lezioni disponibili
                </p>
              </div>
            </div>

            {courseLessonsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-gray-800/50 animate-pulse">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-700 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map((lesson: any) => (
                  <Card
                    key={lesson.id}
                    className={`bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-all duration-300 cursor-pointer group ${
                      isLessonLocked(lesson) ? 'opacity-60' : ''
                    }`}
                    onClick={() => !isLessonLocked(lesson) && setSelectedLesson(lesson)}
                  >
                    <CardContent className="p-4">
                      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-3 overflow-hidden">
                        {/* YouTube Thumbnail */}
                        {lesson.videoUrl && lesson.videoUrl.includes('youtube') && (
                          <img 
                            src={`https://img.youtube.com/vi/${getYouTubeVideoId(lesson.videoUrl)}/maxresdefault.jpg`}
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to medium quality thumbnail
                              e.currentTarget.src = `https://img.youtube.com/vi/${getYouTubeVideoId(lesson.videoUrl)}/mqdefault.jpg`;
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          {isLessonLocked(lesson) ? (
                            <Lock className="h-8 w-8 text-gray-500" />
                          ) : (
                            <div className="bg-purple-600/90 hover:bg-purple-700 transition-colors rounded-full p-3 group-hover:scale-110 transform transition-transform">
                              <Play className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {lesson.duration}min
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {lesson.title}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {lesson.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            isLessonLocked(lesson)
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          {isLessonLocked(lesson) ? 'Bloccata' : 'Disponibile'}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          {lesson.duration}min
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!courseLessonsLoading && filteredLessons.length === 0 && (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Nessuna lezione trovata</h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? `Nessuna lezione corrisponde alla ricerca "${searchTerm}"`
                    : 'Non ci sono lezioni disponibili per questa categoria'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}