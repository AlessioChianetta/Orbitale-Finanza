import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowLeft, Tag, Video, Clock } from 'lucide-react';
import SecureVideoPlayer from '@/components/SecureVideoPlayer';


interface CourseSelectionProps {
  onCourseSelect: (courseId: number) => void;
}

export default function CourseSelection({ onCourseSelect }: CourseSelectionProps) {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/course-categories'],
    enabled: !!selectedCourse,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ['/api/academy/lessons', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const response = await fetch(`/api/academy/lessons?courseId=${selectedCourse}`);
      return response.json();
    },
    enabled: !!selectedCourse,
  });

  // Filter lessons by category (course filtering is done in the API call)
  const filteredLessons = lessons.filter((lesson: any) => {
    if (selectedCategory && lesson.categoryId !== selectedCategory) return false;
    return lesson.isPublished;
  });

  const selectedCourseData = courses.find((c: any) => c.id === selectedCourse);

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 rounded-2xl transform -rotate-1 scale-105 opacity-60"></div>
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-2xl border border-gray-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-2 sm:mb-3">
                      <div className="p-2 sm:p-3 bg-blue-600 rounded-xl shadow-lg flex-shrink-0">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">I Tuoi Corsi</h1>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                          <span className="text-gray-100 text-xs sm:text-sm font-medium truncate">Formazione disponibile</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-medium line-clamp-2">Accedi ai corsi di formazione e migliora le tue competenze</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player */}
        {selectedLesson && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedLesson(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alle Lezioni
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
                <p className="text-muted-foreground">{selectedCourseData?.title}</p>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <SecureVideoPlayer 
                  videoUrl={selectedLesson.videoUrl} 
                  title={selectedLesson.title}
                  lessonId={selectedLesson.id}
                  autoplay={false}
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{selectedLesson.title}</h3>
                  <p className="text-muted-foreground">{selectedLesson.description}</p>
                  {selectedLesson.duration && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Durata: {selectedLesson.duration} minuti</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Selection */}
        {!selectedCourse && !selectedLesson && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Badge variant="outline">{course.level}</Badge>
                      </span>
                      <span className="text-muted-foreground">
                        {course.estimatedDuration} min
                      </span>
                    </div>
                    
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {course.tags.slice(0, 3).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedCourse(course.id)}
                    >
                      Inizia Corso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Course Content */}
        {selectedCourse && !selectedLesson && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCourse(null);
                  setSelectedCategory(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Corsi
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{selectedCourseData?.title}</h2>
                <p className="text-muted-foreground">{selectedCourseData?.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Categorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === null ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(null)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Tutte le lezioni
                      </Button>
                      {categories.map((category: any) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lessons Grid */}
              <div className="lg:col-span-3">
                {filteredLessons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredLessons.map((lesson: any) => (
                      <Card key={lesson.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5" />
                            {lesson.title}
                          </CardTitle>
                          <CardDescription>{lesson.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {lesson.duration && (
                                <>
                                  <Clock className="h-4 w-4" />
                                  <span>{lesson.duration} min</span>
                                </>
                              )}
                            </div>
                            <Button onClick={() => setSelectedLesson(lesson)}>
                              Guarda
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Nessuna lezione disponibile</p>
                      <p className="text-sm">
                        {selectedCategory 
                          ? "Non ci sono lezioni in questa categoria" 
                          : "Non ci sono lezioni pubblicate per questo corso"
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}