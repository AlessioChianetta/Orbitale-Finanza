import { useState, useRef, useEffect } from 'react';
import { safeFloat, safeInt } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  CheckCircle,
  Circle,
  FileText,
  MessageSquare,
  Award,
  Clock
} from 'lucide-react';

import { VideoPlayer } from '@/components/VideoPlayer';

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  estimatedDuration: number;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  videoType?: 'youtube' | 'vimeo' | 'direct';
  duration: number;
  textContent: string;
  materials: LessonMaterial[];
  quiz: QuizQuestion[];
  isCompleted: boolean;
}

interface LessonMaterial {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface CourseViewerProps {
  courseId: number;
}

export default function CourseViewer({ courseId }: CourseViewerProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedDuration, setWatchedDuration] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  const { data: userProgress } = useQuery({
    queryKey: [`/api/courses/${courseId}/progress`],
  });

  // Mutations for progress tracking
  const updateProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      const response = await fetch(`/api/courses/${courseId}/lessons/${currentLesson?.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData),
      });
      if (!response.ok) throw new Error('Failed to update progress');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const response = await fetch(`/api/courses/${courseId}/lessons/${currentLesson?.id}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData),
      });
      if (!response.ok) throw new Error('Failed to submit quiz');
      return response.json();
    },
    onSuccess: (data) => {
      setQuizSubmitted(true);
      toast({ 
        title: `Quiz completato! Punteggio: ${data.score}%`,
        description: data.score >= 70 ? "Ottimo lavoro!" : "Puoi riprovare per migliorare il punteggio."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/progress`] });
    },
  });

  const currentLesson = course?.lessons?.[currentLessonIndex];
  const progressPercentage = course?.lessons ? 
    (course.lessons.filter((l: CourseLesson) => l.isCompleted).length / course.lessons.length) * 100 : 0;

  // Video event handlers
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      setWatchedDuration(currentTime);
      
      // Update progress every 30 seconds
      if (currentTime % 30 < 1) {
        updateProgressMutation.mutate({
          watchedDuration: Math.floor(currentTime),
          lastWatchedAt: new Date().toISOString()
        });
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (currentLesson?.quiz && currentLesson.quiz.length > 0) {
      setShowQuiz(true);
    } else {
      markLessonComplete();
    }
  };

  const markLessonComplete = () => {
    updateProgressMutation.mutate({
      isCompleted: true,
      completedAt: new Date().toISOString(),
      notes: userNotes
    });
  };

  const handleQuizSubmit = () => {
    if (!currentLesson?.quiz) return;
    
    let correctAnswers = 0;
    currentLesson.quiz.forEach((question) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / currentLesson.quiz.length) * 100);
    
    submitQuizMutation.mutate({
      answers: quizAnswers,
      score,
      attempts: 1
    });
  };

  const nextLesson = () => {
    if (currentLessonIndex < (course?.lessons?.length || 0) - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setShowQuiz(false);
      setQuizSubmitted(false);
      setQuizAnswers({});
      setUserNotes("");
    }
  };

  const previousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setShowQuiz(false);
      setQuizSubmitted(false);
      setQuizAnswers({});
    }
  };

  const handleMaterialDownload = (material: LessonMaterial) => {
    // Track download analytics
    fetch(`/api/courses/${courseId}/materials/${material.id}/download`, {
      method: 'POST'
    });
    
    // Open download link
    window.open(material.fileUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Corso non trovato</h3>
              <p className="text-muted-foreground">Il corso richiesto non esiste o non è disponibile.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Course Header */}
        <div className="mb-6">
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
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate">{course.title}</h1>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="border-white/30 text-white text-xs">{course.level}</Badge>
                          <span className="text-gray-300 text-xs sm:text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.estimatedDuration} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-sm text-gray-300 mb-1">Progresso</div>
                    <div className="flex items-center gap-2">
                      <Progress value={progressPercentage} className="w-32" />
                      <span className="text-sm font-medium text-white">{Math.round(progressPercentage)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            {currentLesson && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentLesson.title}</CardTitle>
                      <CardDescription>{currentLesson.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={previousLesson}
                        disabled={currentLessonIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Precedente
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextLesson}
                        disabled={currentLessonIndex === (course.lessons?.length || 0) - 1}
                      >
                        Prossima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentLesson.videoUrl ? (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <VideoPlayer 
                        videoUrl={currentLesson.videoUrl}
                        videoType={currentLesson.videoType}
                        title={currentLesson.title}
                        className="aspect-video"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Lezione testuale</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lesson Content */}
            {currentLesson?.textContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Contenuto della lezione</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    {currentLesson.textContent}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Section */}
            {showQuiz && currentLesson?.quiz && currentLesson.quiz.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quiz di verifica</CardTitle>
                  <CardDescription>
                    Completa il quiz per verificare la tua comprensione della lezione
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentLesson.quiz.map((question, qIndex) => (
                    <div key={question.id} className="space-y-3">
                      <h4 className="font-medium">
                        {qIndex + 1}. {question.question}
                      </h4>
                      <RadioGroup
                        value={quizAnswers[question.id]?.toString()}
                        onValueChange={(value) => 
                          setQuizAnswers(prev => ({ ...prev, [question.id]: safeInt(value) }))
                        }
                        disabled={quizSubmitted}
                      >
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={oIndex.toString()} id={`q${question.id}-${oIndex}`} />
                            <Label 
                              htmlFor={`q${question.id}-${oIndex}`}
                              className={`flex-1 ${quizSubmitted && oIndex === question.correctAnswer ? 'text-green-600 font-medium' : ''}`}
                            >
                              {option}
                            </Label>
                            {quizSubmitted && oIndex === question.correctAnswer && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {quizSubmitted && question.explanation && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Spiegazione:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!quizSubmitted && (
                    <div className="flex gap-2">
                      <Button onClick={handleQuizSubmit} disabled={submitQuizMutation.isPending}>
                        Invia risposte
                      </Button>
                      <Button variant="outline" onClick={() => setShowQuiz(false)}>
                        Salta quiz
                      </Button>
                    </div>
                  )}
                  
                  {quizSubmitted && (
                    <Button onClick={markLessonComplete}>
                      Completa lezione
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Le tue note</CardTitle>
                <CardDescription>
                  Aggiungi note personali per questa lezione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Scrivi le tue note qui..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Lesson List */}
            <Card>
              <CardHeader>
                <CardTitle>Lezioni del corso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {course.lessons?.map((lesson: CourseLesson, index: number) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLessonIndex(index)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        index === currentLessonIndex 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {lesson.isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">{lesson.duration} min</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Materials */}
            {currentLesson?.materials && currentLesson.materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Materiali scaricabili</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentLesson.materials.map((material: LessonMaterial) => (
                      <button
                        key={material.id}
                        onClick={() => handleMaterialDownload(material)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{material.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {material.fileType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Domande frequenti</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="help">
                    <AccordionTrigger>Hai dubbi?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Non riesci a seguire la lezione? Contatta il nostro supporto.
                        </p>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chatta con noi
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}