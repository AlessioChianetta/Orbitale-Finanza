import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import VideoLessonsGrid from '../components/VideoLessonsGrid';
import CommunityFeed from '../components/CommunityFeed';
import { Play, Users, Calendar, Clock, Award, Search, Filter, Home, GraduationCap, BookOpen, TrendingUp, ThumbsUp, MessageCircle, Save, Edit3, Maximize, Minimize, Monitor, Tablet, Smartphone, ArrowLeft } from 'lucide-react';

function VideoProgressInfo({ lessonId }: { lessonId: number }) {
  const queryClient = useQueryClient();
  const { data: progress, isLoading } = useQuery({
    queryKey: ['/api/video-progress', lessonId],
    queryFn: () => fetch(`/api/video-progress/${lessonId}`, { credentials: 'include' }).then(res => res.json())
  });

  // Listen for completion events to refresh data
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent) => {
      if (event.detail.lessonId === lessonId) {
        queryClient.invalidateQueries({ queryKey: ['/api/video-progress', lessonId] });
      }
    };

    window.addEventListener('videoProgressUpdated', handleProgressUpdate as EventListener);
    return () => window.removeEventListener('videoProgressUpdated', handleProgressUpdate as EventListener);
  }, [lessonId, queryClient]);

  console.log('VideoProgressInfo - lessonId:', lessonId, 'progress:', progress);

  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg text-sm">
        <h4 className="text-white font-semibold mb-3">📊 Statistiche Visualizzazione</h4>
        <div className="text-gray-400">Caricamento...</div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg text-sm">
        <h4 className="text-white font-semibold mb-3">📊 Statistiche Visualizzazione</h4>
        <div className="text-gray-400">Nessun dato di progresso disponibile</div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg text-sm">
      <h4 className="text-white font-semibold mb-3">📊 Statistiche Visualizzazione</h4>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700/50 p-3 rounded">
          <div className="text-gray-400 text-xs">Progresso Completamento</div>
          <div className="text-white font-bold text-lg">{Math.round(progress.completionPercentage || 0)}%</div>
        </div>
        <div className="bg-gray-700/50 p-3 rounded">
          <div className="text-gray-400 text-xs">Tempo Guardato</div>
          <div className="text-white font-bold text-lg">{formatTime(progress.watchedSeconds || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700/50 p-3 rounded">
          <div className="text-gray-400 text-xs">Durata Totale</div>
          <div className="text-white font-bold">{formatTime(progress.totalDuration || 0)}</div>
        </div>
        <div className="bg-gray-700/50 p-3 rounded">
          <div className="text-gray-400 text-xs">Visualizzazioni</div>
          <div className="text-white font-bold">{progress.watchCount || 0}</div>
        </div>
      </div>

      {progress.lastWatchedAt && (
        <div className="bg-gray-700/50 p-3 rounded mb-4">
          <div className="text-gray-400 text-xs">Ultima Visualizzazione</div>
          <div className="text-white font-bold">{formatDate(progress.lastWatchedAt)}</div>
        </div>
      )}

      <div className="mb-2">
        <div className="flex justify-between text-gray-300 mb-1">
          <span>Progresso Video</span>
          <span>{formatTime(progress.watchedSeconds || 0)} / {formatTime(progress.totalDuration || 0)}</span>
        </div>
        <Progress value={progress.completionPercentage || 0} className="h-2" />
      </div>

      {(progress.completionPercentage || 0) >= 90 && (
        <div className="mt-3 p-2 bg-green-600/20 border border-green-600/30 rounded text-green-400 text-xs">
          🎉 Video completato! Ottimo lavoro!
        </div>
      )}
    </div>
  );
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Lesson {
  id: number;
  courseId: number;
  title: string;
  description: string;
  videoUrl: string;
  videoType?: string;
  categoryId?: number;
  duration?: number;
  sortOrder: number;
  isPublished: boolean;
  thumbnail?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  tags: string[];
  estimatedDuration: number;
  isPublished: boolean;
  lessons?: Lesson[];
}

interface Tutor {
  id: number;
  name: string;
  email: string;
  role: string;
  specialization: string;
  experience: string;
  bio: string;
  hourlyRate: number;
  isActive: boolean;
  rating: number;
  totalReviews: number;
}



export default function InvestmentAcademy() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [videoViewMode, setVideoViewMode] = useState<'compact' | 'expanded' | 'fullscreen'>('expanded');

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/course-categories'],
    queryFn: async () => {
      const response = await fetch('/api/course-categories', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch categories:', response.status, response.statusText);
        return [];
      }
      return response.json();
    }
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch courses:', response.status, response.statusText);
        return [];
      }
      return response.json();
    }
  });

  // Fetch all lessons
  const { data: allLessons = [] } = useQuery({
    queryKey: ['/api/lessons/all'],
    queryFn: async () => {
      const response = await fetch('/api/lessons/all', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch lessons:', response.status, response.statusText);
        return [];
      }
      return response.json();
    }
  });

  // Fetch user data to get current user email
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch user:', response.status, response.statusText);
        return null;
      }
      return response.json();
    }
  });

  // Fetch tutors
  const { data: allTutors = [] } = useQuery({
    queryKey: ['/api/tutors'],
    queryFn: async () => {
      const response = await fetch('/api/tutors', {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('Failed to fetch tutors:', response.status, response.statusText);
        return [];
      }
      return response.json();
    }
  });

  // Filter tutors to show only those assigned to current user's email
  const tutors = allTutors.filter((tutor: Tutor) => {
    if (!userData?.email || !tutor.assignedEmails) return false;
    return tutor.assignedEmails.includes(userData.email) && tutor.isActive;
  });

  // Real community posts are now handled by CommunityFeed component

  // Close video player
  const handleCloseVideo = () => {
    setSelectedLesson(null);
  };

  // Filter lessons
  const filteredLessons = allLessons.filter((lesson: Lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || lesson.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && lesson.isPublished;
  });

  const isLessonLocked = (lesson: Lesson) => {
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">

      {/* Top Navigation */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-transparent border-none h-16">
                <TabsTrigger 
                  value="home" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Home className="h-4 w-4" />
                  Home
                </TabsTrigger>
                <TabsTrigger 
                  value="academy" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <GraduationCap className="h-4 w-4" />
                  Academy
                </TabsTrigger>
                <TabsTrigger 
                  value="corsi" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <BookOpen className="h-4 w-4" />
                  I tuoi Corsi
                </TabsTrigger>
                <TabsTrigger 
                  value="masterclass" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Award className="h-4 w-4" />
                  Masterclass
                </TabsTrigger>
                <TabsTrigger 
                  value="tutor" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4" />
                  Tutor
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Ciao, e benvenuto!</h1>
              <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-6 border border-purple-500/30">
                <p className="text-lg text-gray-300 leading-relaxed mb-4">
                  Benvenuto nella nostra <span className="text-white font-semibold">Academy di Investimenti</span>, 
                  dove trasformiamo la complessità del mondo finanziario in un percorso chiaro e strutturato.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4">
                  <span className="text-blue-400 font-medium">I contenuti formativi esistono gratuitamente</span>, 
                  ma trovarli, selezionarli e organizzarli richiede tempo e competenze che non tutti hanno. 
                  <span className="text-white font-medium">Noi lo facciamo per te</span>: curiamo, organizziamo e strutturiamo 
                  i migliori contenuti da YouTube in percorsi di apprendimento progressivi, affiancati da una community 
                  esclusiva di investitori esperti.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Contenuti Curati e Organizzati</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Percorsi Strutturati</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Community Esclusiva</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Community Posts */}
              <div className="lg:col-span-2 space-y-4">
                <CommunityFeed />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Intro Video */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Introduzione alla Piattaforma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center mb-4">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      Tour piattaforma SFR per la Trial
                    </p>
                    <Badge className="bg-blue-600 text-white">COME FUNZIONA LA PIATTAFORMA</Badge>
                  </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Leaderboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-yellow-400 font-bold">1</span>
                          <span className="text-white">Salvo Rossi</span>
                        </div>
                        <span className="text-blue-400 font-bold">285</span>
                      </div>
                      <div className="text-center py-4 text-gray-400">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Invita amici per vedere più utenti nella classifica</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Le tue Statistiche</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Corsi completati</span>
                        <span className="text-white font-bold">0/{courses.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ore di studio</span>
                        <span className="text-white font-bold">0h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ranking attuale</span>
                        <span className="text-white font-bold">BLACK LV 4</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Academy Tab */}
          <TabsContent value="academy" className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg shadow-lg">
              <h2 className="text-3xl font-bold mb-4">Benvenuto nell'Accademia degli Investimenti</h2>
              <p className="text-lg mb-6">
                La piattaforma più completa per imparare a investire e costruire la tua libertà finanziaria
              </p>
              <div className="flex gap-4">
                <Button 
                  onClick={() => setActiveTab('academy')}
                  className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200"
                >
                  <span className="relative z-10 font-medium">Inizia ad Imparare</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('corsi')}
                  className="border-gray-300 text-gray-300 hover:bg-gray-300 hover:text-blue-600 transition-all duration-200"
                >
                  <span className="relative z-10">I Tuoi Corsi</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 flex items-center">
                  <div className="bg-blue-600 p-3 rounded-lg mr-4">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{courses.length}</div>
                    <div className="text-gray-400">Corsi Disponibili</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 flex items-center">
                  <div className="bg-green-600 p-3 rounded-lg mr-4">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{allLessons.length}</div>
                    <div className="text-gray-400">Lezioni Totali</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6 flex items-center">
                  <div className="bg-purple-600 p-3 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{tutors.filter(t => t.isActive).length}</div>
                    <div className="text-gray-400">Tutor Attivi</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Selection or Lessons View */}
            {!selectedCourse ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Seleziona un corso per iniziare</h2>
                <p className="text-gray-400 mb-6">Scegli un corso per visualizzare le lezioni disponibili.</p>
                
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course: Course) => (
                      <Card key={course.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <Badge variant="secondary" className="bg-purple-600 text-white mb-2">
                              {course.level}
                            </Badge>
                            <div className="text-right text-sm text-gray-400">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {course.estimatedDuration}min
                            </div>
                          </div>
                          <CardTitle className="text-white">{course.title}</CardTitle>
                          <CardDescription className="text-gray-300">
                            {course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {course.tags?.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                            onClick={() => {
                              setSelectedCourse(course.id);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Inizia Corso
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
                    <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">Nessun corso disponibile</h3>
                    <p className="text-gray-500">I corsi saranno presto disponibili</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-8">
                {/* Back to Courses Button */}
                <div className="mb-6">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedCourse(null);
                      setSelectedCategory(null);
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Torna ai Corsi
                  </Button>
                </div>

                {/* Course Header */}
                {(() => {
                  const currentCourse = courses.find(c => c.id === selectedCourse);
                  return currentCourse ? (
                    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-6 mb-6 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary" className="bg-purple-600 text-white">
                          {currentCourse.level}
                        </Badge>
                        <div className="text-sm text-gray-400">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {currentCourse.estimatedDuration}min
                        </div>
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">{currentCourse.title}</h2>
                      <p className="text-gray-300 mb-4">{currentCourse.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {currentCourse.tags?.map((tag, index) => (
                          <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                <VideoLessonsGrid 
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedCourse={selectedCourse}
                  setSelectedCourse={setSelectedCourse}
                  selectedLesson={selectedLesson}
                  setSelectedLesson={setSelectedLesson}
                  categories={categories}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="corsi" className="space-y-4">
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course: Course) => (
                  <Card key={course.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary" className="bg-purple-600 text-white mb-2">
                          {course.level}
                        </Badge>
                        <div className="text-right text-sm text-gray-400">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {course.estimatedDuration}min
                        </div>
                      </div>
                      <CardTitle className="text-white">{course.title}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {course.tags?.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => {
                          setSelectedCourse(course.id);
                          setActiveTab('academy');
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Inizia Corso
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Nessun corso disponibile</h3>
                <p className="text-gray-500">I corsi saranno presto disponibili</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="masterclass" className="space-y-4">
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Masterclass in arrivo</h3>
              <p className="text-gray-500">Le masterclass esclusive saranno presto disponibili</p>
            </div>
          </TabsContent>

          <TabsContent value="tutor" className="space-y-4">
            {tutors && tutors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutors.filter((tutor: Tutor) => tutor.isActive).map((tutor: Tutor) => (
                  <Card key={tutor.id} className="bg-gray-800/50 border-gray-700 hover:border-blue-500 transition-colors">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {tutor.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-white">{tutor.name}</CardTitle>
                          <p className="text-blue-400">{tutor.role}</p>
                          <p className="text-sm text-gray-400">{tutor.specialization}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4 line-clamp-3">{tutor.bio}</p>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-400">
                          <span className="text-yellow-400">★ {tutor.rating}</span>
                          <span className="ml-1">({tutor.totalReviews} recensioni)</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                          €{tutor.hourlyRate}/h
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Prenota Sessione
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Nessun tutor disponibile</h3>
                <p className="text-gray-500">I tutor saranno presto disponibili</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Player Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50">
          <div className="h-full flex flex-col">
            {/* Header with View Controls */}
            <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-semibold text-white">{selectedLesson.title}</h3>
                
                {/* View Mode Controls */}
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={videoViewMode === 'compact' ? 'default' : 'ghost'}
                    onClick={() => setVideoViewMode('compact')}
                    className="h-8 px-3 text-xs"
                    title="Video Piccolo con Info"
                  >
                    <Smartphone className="h-4 w-4 mr-1" />
                    Compatto
                  </Button>
                  <Button
                    size="sm"
                    variant={videoViewMode === 'expanded' ? 'default' : 'ghost'}
                    onClick={() => setVideoViewMode('expanded')}
                    className="h-8 px-3 text-xs"
                    title="Video Occupa Tutto lo Spazio Nero"
                  >
                    <Tablet className="h-4 w-4 mr-1" />
                    Pieno
                  </Button>
                  <Button
                    size="sm"
                    variant={videoViewMode === 'fullscreen' ? 'default' : 'ghost'}
                    onClick={() => setVideoViewMode('fullscreen')}
                    className="h-8 px-3 text-xs"
                    title="Cinema - Info sotto"
                  >
                    <Monitor className="h-4 w-4 mr-1" />
                    Cinema
                  </Button>
                </div>
              </div>
              
              <Button variant="ghost" onClick={handleCloseVideo} className="text-white hover:bg-gray-700">
                ✕
              </Button>
            </div>
            
            {/* Main Content - Dynamic Layout */}
            <div className={`flex-1 flex overflow-hidden ${
              videoViewMode === 'fullscreen' ? 'flex-col' : 'flex-row'
            }`}>
              {/* Video Player */}
              <div className={`bg-black flex items-center justify-center ${
                videoViewMode === 'compact' ? 'w-2/3 p-8' :
                videoViewMode === 'expanded' ? 'flex-1 p-2' :
                'flex-1 p-1'
              }`}>
                <div className={`w-full h-full flex items-center justify-center ${
                  videoViewMode === 'compact' ? 'max-w-3xl max-h-[60vh]' :
                  videoViewMode === 'expanded' ? 'max-w-none max-h-none' :
                  'max-w-none max-h-none'
                }`}>
                  <div className={`w-full ${
                    videoViewMode === 'compact' ? 'aspect-video' :
                    videoViewMode === 'expanded' ? 'h-full' :
                    'h-full'
                  }`}>
                    <SecureVideoPlayer
                      videoUrl={selectedLesson.videoUrl}
                      title={selectedLesson.title}
                      lessonId={selectedLesson.id}
                      autoplay={false}
                    />
                  </div>
                </div>
              </div>
              
              {/* Sidebar */}
              <div className={`bg-gray-900 overflow-y-auto ${
                videoViewMode === 'compact' ? 'w-1/3 border-l border-gray-700' :
                videoViewMode === 'expanded' ? 'w-96 border-l border-gray-700' :
                'w-full border-t border-gray-700 max-h-80'
              }`}>
                <div className="p-4">
                  {/* Lesson Info */}
                  <div className="mb-6">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      📚 Informazioni Lezione
                      {videoViewMode === 'fullscreen' && (
                        <Badge variant="secondary" className="text-xs">Vista Cinema</Badge>
                      )}
                    </h4>
                    <div className="bg-gray-800 p-3 rounded-lg text-sm">
                      <div className="text-gray-400 mb-2">{selectedLesson.description}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>⏱️ {selectedLesson.duration} min</span>
                        <span>📅 Corso Bitcoin</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <VideoProgressInfo lessonId={selectedLesson.id} />
                  
                  {/* Manual Completion Button */}
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-white font-semibold mb-3">✅ Controllo Completamento</h4>
                    <Button 
                      onClick={async () => {
                        try {
                          await fetch(`/api/video-progress`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              lessonId: selectedLesson.id,
                              currentPosition: selectedLesson.duration ? selectedLesson.duration * 60 : 1980,
                              totalDuration: selectedLesson.duration ? selectedLesson.duration * 60 : 1980,
                              watchedSeconds: selectedLesson.duration ? selectedLesson.duration * 60 : 1980,
                              completionPercentage: 100
                            })
                          });
                          // Force re-render of progress component without page reload
                          window.dispatchEvent(new CustomEvent('videoProgressUpdated', { 
                            detail: { lessonId: selectedLesson.id } 
                          }));
                        } catch (error) {
                          console.error('Error marking completion:', error);
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                    >
                      <span className="relative z-10 font-medium">Ho completato questo video</span>
                    </Button>
                    <p className="text-gray-400 text-xs mt-2">
                      Clicca questo pulsante quando hai finito di guardare il video
                    </p>
                  </div>

                  {/* Personal Notes */}
                  <PersonalNotes lessonId={selectedLesson.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonalNotes({ lessonId }: { lessonId: number }) {
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing notes
  const { data: savedNotes } = useQuery({
    queryKey: ['/api/lesson-notes', lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/lesson-notes/${lessonId}`, { credentials: 'include' });
      if (!response.ok) return { notes: '' };
      return response.json();
    }
  });

  useEffect(() => {
    if (savedNotes?.notes) {
      setNotes(savedNotes.notes);
    }
  }, [savedNotes]);

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/lesson-notes/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes })
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
    setIsSaving(false);
  };

  const viewCount = savedNotes?.viewCount || 1;
  const lastViewed = savedNotes?.lastViewed;

  return (
    <div className="mt-6">
      <h4 className="text-white font-semibold mb-3">📝 Note Personali</h4>
      
      {/* View Statistics */}
      <div className="bg-gray-800 p-3 rounded-lg mb-4 text-sm">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <div className="text-gray-400 text-xs">Visualizzazioni</div>
            <div className="text-white font-bold text-lg">{viewCount}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-xs">Ultima Vista</div>
            <div className="text-white font-bold text-xs">
              {lastViewed ? new Date(lastViewed).toLocaleDateString('it-IT') : 'Prima volta'}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section with Better UI */}
      <div className="bg-gray-800 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-300 text-sm">Le tue note</span>
          {!isEditing ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-white p-1 h-auto"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={saveNotes}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white p-1 h-auto text-xs"
            >
              {isSaving ? <Save className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="💡 Scrivi qui i tuoi appunti personali...

Puoi annotare:
• Concetti chiave del video
• Domande da approfondire  
• Idee e riflessioni personali
• Link a risorse aggiuntive"
              className="w-full h-32 bg-gray-700 text-white text-sm p-3 rounded border border-gray-600 focus:border-purple-500 focus:outline-none resize-none placeholder-gray-500"
            />

          </div>
        ) : (
          <div className="bg-gray-700/50 rounded p-3 min-h-[8rem]">
            {notes ? (
              <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {notes}
              </div>
            ) : (
              <span className="text-gray-500 italic">Nessuna nota scritta</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}