import { useState } from 'react';
import { safeFloat, safeInt } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  BookOpen, 
  Video, 
  FileText,
  Award,
  Settings,
  BarChart3,
  Search,
  Tag,
  ExternalLink
} from 'lucide-react';
import LessonsManager from '@/components/LessonsManager';


interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  tags: string[];
  estimatedDuration: number;
  isPublished: boolean;
  lessonsCount?: number;
  enrolledCount?: number;
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
  assignedEmails?: string[];
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
  categoryId?: number;
  duration?: number;
  sortOrder: number;
  isPublished: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/admin/courses'],
  });

  const { data: tutors, isLoading: tutorsLoading } = useQuery({
    queryKey: ['/api/admin/tutors'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/admin/course-categories'],
  });

  // Filter categories for selected course when creating/editing lessons
  const filteredCategories = selectedCourse 
    ? categories.filter((cat: any) => cat.courseId === selectedCourse.id)
    : [];

  const { data: lessons } = useQuery({
    queryKey: ['/api/admin/courses', selectedCourse?.id, 'lessons'],
    enabled: !!selectedCourse,
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
  });

  // Course mutations
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });
      if (!response.ok) throw new Error('Failed to create course');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setIsDialogOpen(false);
      setSelectedCourse(null);
      toast({ title: "Corso creato con successo" });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...courseData }: any) => {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });
      if (!response.ok) throw new Error('Failed to update course');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setIsDialogOpen(false);
      setSelectedCourse(null);
      toast({ title: "Corso aggiornato con successo" });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete course');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({ title: "Corso eliminato con successo" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await fetch('/api/admin/course-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/course-categories'] });
      setIsDialogOpen(false);
      setSelectedCategory(null);
      toast({ title: "Categoria creata con successo" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...categoryData }: any) => {
      const response = await fetch(`/api/admin/course-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/course-categories'] });
      setIsDialogOpen(false);
      setSelectedCategory(null);
      toast({ title: "Categoria aggiornata con successo" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/course-categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/course-categories'] });
      toast({ title: "Categoria eliminata con successo" });
    },
  });

  // Tutor mutations
  const createTutorMutation = useMutation({
    mutationFn: async (tutorData: any) => {
      const response = await fetch('/api/admin/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tutorData),
      });
      if (!response.ok) throw new Error('Failed to create tutor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tutors'] });
      setIsDialogOpen(false);
      setSelectedTutor(null);
      toast({ title: "Tutor creato con successo" });
    },
  });

  const updateTutorMutation = useMutation({
    mutationFn: async ({ id, ...tutorData }: any) => {
      const response = await fetch(`/api/admin/tutors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tutorData),
      });
      if (!response.ok) throw new Error('Failed to update tutor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tutors'] });
      setIsDialogOpen(false);
      setSelectedTutor(null);
      toast({ title: "Tutor aggiornato con successo" });
    },
  });

  const deleteTutorMutation = useMutation({
    mutationFn: async (tutorId: number) => {
      const response = await fetch(`/api/admin/tutors/${tutorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete tutor');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tutors'] });
      toast({ title: "Tutor eliminato con successo" });
    },
  });

  // Lesson mutations
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await fetch(`/api/admin/courses/${selectedCourse?.id}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
      });
      if (!response.ok) throw new Error('Failed to create lesson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', selectedCourse?.id, 'lessons'] });
      setIsDialogOpen(false);
      setSelectedLesson(null);
      toast({ title: "Lezione creata con successo" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, ...lessonData }: any) => {
      const response = await fetch(`/api/admin/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
      });
      if (!response.ok) throw new Error('Failed to update lesson');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', selectedCourse?.id, 'lessons'] });
      setIsDialogOpen(false);
      setSelectedLesson(null);
      toast({ title: "Lezione aggiornata con successo" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete lesson');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', selectedCourse?.id, 'lessons'] });
      toast({ title: "Lezione eliminata con successo" });
    },
  });



  // Form handlers
  const handleCourseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const courseData = {
      title: formData.get('title'),
      description: formData.get('description'),
      level: formData.get('level'),
      tags: formData.get('tags')?.toString().split(',').map(tag => tag.trim()) || [],
      estimatedDuration: safeInt(formData.get('estimatedDuration')?.toString()),
      isPublished: formData.get('isPublished') === 'on',
    };

    if (selectedCourse) {
      updateCourseMutation.mutate({ id: selectedCourse.id, ...courseData });
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const courseId = formData.get('courseId') as string;
    
    if (!courseId) {
      alert('Seleziona un corso per la categoria');
      return;
    }

    const categoryData = {
      name: formData.get('categoryName'),
      description: formData.get('categoryDescription'),
      icon: formData.get('categoryIcon'),
      color: formData.get('categoryColor'),
      courseId: safeInt(courseId),
    };
    
    if (selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, ...categoryData });
    } else {
      createCategoryMutation.mutate(categoryData);
    }
  };

  const handleTutorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Parse assigned emails from textarea
    const assignedEmailsText = formData.get('assignedEmails')?.toString() || '';
    const assignedEmails = assignedEmailsText
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    const tutorData = {
      name: formData.get('tutorName'),
      email: formData.get('tutorEmail'),
      role: formData.get('tutorRole'),
      specialization: formData.get('tutorSpecialization'),
      experience: formData.get('tutorExperience'),
      bio: formData.get('tutorBio'),
      hourlyRate: safeFloat(formData.get('hourlyRate')?.toString()),
      isActive: formData.get('tutorActive') === 'on',
      rating: safeFloat(formData.get('tutorRating')?.toString()),
      totalReviews: safeInt(formData.get('totalReviews')?.toString()),
      assignedEmails: assignedEmails,
    };
    
    if (selectedTutor) {
      updateTutorMutation.mutate({ id: selectedTutor.id, ...tutorData });
    } else {
      createTutorMutation.mutate(tutorData);
    }
  };

  const handleLessonSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const lessonData = {
      courseId: selectedCourse?.id,
      title: formData.get('lessonTitle'),
      description: formData.get('lessonDescription'),
      videoUrl: formData.get('videoUrl'),
      categoryId: safeInt(formData.get('lessonCategory')?.toString()) || null,
      duration: safeInt(formData.get('lessonDuration')?.toString()) || null,
      sortOrder: parseInt(formData.get('lessonOrder')?.toString() || '0') || 0,
      isPublished: formData.get('lessonPublished') === 'on',
    };
    
    if (selectedLesson) {
      updateLessonMutation.mutate({ id: selectedLesson.id, ...lessonData });
    } else {
      createLessonMutation.mutate(lessonData);
    }
  };

  const filteredCourses = courses?.filter((course: Course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Area Amministrazione</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestisci corsi, categorie, lezioni e tutor della piattaforma</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Corsi
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categorie
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Lezioni
            </TabsTrigger>
            <TabsTrigger value="tutors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tutor
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contenuti
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Corsi Totali</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {courses?.filter((c: Course) => c.isPublished).length || 0} pubblicati
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categorie</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{categories?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">categorie attive</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tutor Attivi</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tutors?.filter((t: Tutor) => t.isActive).length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    su {tutors?.length || 0} totali
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utenti Iscritti</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics?.newUsersThisMonth || 0} questo mese
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gestione Categorie</h2>
                <p className="text-muted-foreground">Crea e gestisci le categorie per organizzare le lezioni dei corsi</p>
              </div>
              <Button 
                onClick={() => {
                  setSelectedCategory(null);
                  setIsDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuova Categoria
              </Button>
            </div>

            {/* Group categories by course */}
            {courses?.map((course: Course) => {
              const courseCategories = categories?.filter((cat: any) => cat.courseId === course.id) || [];
              
              return (
                <div key={course.id} className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-blue-600">{course.title}</h3>
                  
                  {courseCategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courseCategories.map((category: any) => (
                        <Card key={category.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {category.icon && (
                                  <span className="text-2xl">{category.icon}</span>
                                )}
                                <div>
                                  <CardTitle className="text-base">{category.name}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {category.description}
                                  </CardDescription>
                                </div>
                              </div>
                              {category.color && (
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-gray-200" 
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setIsDialogOpen(true);
                                }}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifica
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteCategoryMutation.mutate(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nessuna categoria per questo corso</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}

            {(!courses || courses.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun corso presente</p>
                <p className="text-sm">Crea prima un corso per poter aggiungere categorie</p>
              </div>
            )}
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gestione Lezioni</h2>
                <p className="text-muted-foreground">Gestisci le lezioni dei corsi con video YouTube/Vimeo</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedCourse?.id?.toString() || ''} onValueChange={(value) => {
                  const course = courses?.find((c: any) => c.id === safeInt(value));
                  setSelectedCourse(course || null);
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleziona corso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCourse ? (
              <LessonsManager 
                courseId={selectedCourse.id} 
                courseName={selectedCourse.title} 
                categories={filteredCategories} 
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seleziona un corso per gestire le sue lezioni</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cerca corsi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-80"
                  />
                </div>
              </div>
              
              <Button onClick={() => {setSelectedCourse(null); setIsDialogOpen(true);}}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Corso
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full mb-4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredCourses.map((course: Course) => (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {course.description}
                          </CardDescription>
                        </div>
                        <Badge variant={course.isPublished ? "default" : "secondary"}>
                          {course.isPublished ? "Pubblicato" : "Bozza"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Livello: {course.level}</span>
                          <span>{course.estimatedDuration} min</span>
                        </div>
                        
                        {course.tags && course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {course.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {course.lessonsCount || 0} lezioni
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {setSelectedCourse(course); setIsDialogOpen(true);}}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteCourseMutation.mutate(course.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tutors Tab */}
          <TabsContent value="tutors" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gestione Tutor</h2>
                <p className="text-muted-foreground">Crea e gestisci i tutor/consulenti della piattaforma</p>
              </div>
              <Button onClick={() => {setSelectedTutor(null); setIsDialogOpen(true);}}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Tutor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full mb-4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                tutors?.map((tutor: Tutor) => (
                  <Card key={tutor.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {tutor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base">{tutor.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {tutor.role}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={tutor.isActive ? "default" : "secondary"}>
                          {tutor.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Specializzazione:</strong> {tutor.specialization}
                        </div>
                        <div className="text-sm">
                          <strong>Esperienza:</strong> {tutor.experience}
                        </div>
                        <div className="text-sm">
                          <strong>Tariffa:</strong> €{tutor.hourlyRate}/ora
                        </div>
                        <div className="flex items-center text-sm">
                          <strong>Rating:</strong> 
                          <span className="text-yellow-500 ml-1">
                            ★ {tutor.rating || '0.0'}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            ({tutor.totalReviews || 0} recensioni)
                          </span>
                        </div>
                        
                        {tutor.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {tutor.bio}
                          </p>
                        )}
                        
                        {tutor.assignedEmails && tutor.assignedEmails.length > 0 && (
                          <div className="text-xs text-blue-600 mt-2">
                            <strong>Assegnato a:</strong> {tutor.assignedEmails.slice(0, 2).join(', ')}
                            {tutor.assignedEmails.length > 2 && ` +${tutor.assignedEmails.length - 2} altri`}
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {setSelectedTutor(tutor); setIsDialogOpen(true);}}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTutorMutation.mutate(tutor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {(!tutors || tutors.length === 0) && !tutorsLoading && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessun tutor presente</h3>
                <p className="text-muted-foreground mb-4">
                  Inizia creando il primo tutor per la piattaforma
                </p>
                <Button onClick={() => {setSelectedTutor(null); setIsDialogOpen(true);}}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Primo Tutor
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Gestione Contenuti</h3>
              <p className="text-muted-foreground">
                Questa sezione è in sviluppo per gestire i contenuti della piattaforma.
              </p>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Analytics</h3>
              <p className="text-muted-foreground">
                Questa sezione è in sviluppo per mostrare statistiche dettagliate.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog for creating/editing */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'courses' && (selectedCourse ? 'Modifica Corso' : 'Nuovo Corso')}
              {activeTab === 'categories' && (selectedCategory ? 'Modifica Categoria' : 'Nuova Categoria')}
              {activeTab === 'lessons' && (selectedLesson ? 'Modifica Lezione' : 'Nuova Lezione')}
              {activeTab === 'tutors' && (selectedTutor ? 'Modifica Tutor' : 'Nuovo Tutor')}
            </DialogTitle>
          </DialogHeader>

          {/* Course Form */}
          {activeTab === 'courses' && (
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={selectedCourse?.title || ''}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={selectedCourse?.description || ''}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Livello</Label>
                  <Select name="level" defaultValue={selectedCourse?.level || 'beginner'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Principiante</SelectItem>
                      <SelectItem value="intermediate">Intermedio</SelectItem>
                      <SelectItem value="advanced">Avanzato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Durata (minuti)</Label>
                  <Input 
                    id="estimatedDuration" 
                    name="estimatedDuration" 
                    type="number"
                    defaultValue={selectedCourse?.estimatedDuration || ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tag (separati da virgola)</Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  defaultValue={selectedCourse?.tags?.join(', ') || ''}
                  placeholder="Onboarding, Avanzato, Vendite..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPublished" 
                  name="isPublished"
                  defaultChecked={selectedCourse?.isPublished || false}
                />
                <Label htmlFor="isPublished">Pubblicato</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createCourseMutation.isPending || updateCourseMutation.isPending}>
                  {selectedCourse ? 'Aggiorna' : 'Crea'}
                </Button>
              </div>
            </form>
          )}

          {/* Category Form */}
          {activeTab === 'categories' && (
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Corso</Label>
                <select 
                  name="courseId" 
                  defaultValue={selectedCategory?.courseId?.toString()}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Seleziona un corso</option>
                  {courses?.map((course: Course) => (
                    <option key={course.id} value={course.id.toString()}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryName">Nome Categoria</Label>
                <Input 
                  id="categoryName" 
                  name="categoryName" 
                  defaultValue={selectedCategory?.name || ''}
                  required 
                  placeholder="Es. Principianti, Avanzato, Trading..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Descrizione</Label>
                <Textarea 
                  id="categoryDescription" 
                  name="categoryDescription" 
                  defaultValue={selectedCategory?.description || ''}
                  rows={3}
                  placeholder="Descrivi il contenuto di questa categoria..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryIcon">Icona (Emoji)</Label>
                  <Input 
                    id="categoryIcon" 
                    name="categoryIcon" 
                    defaultValue={selectedCategory?.icon || ''}
                    placeholder="📈 📊 💰 🎯 📚"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryColor">Colore</Label>
                  <Input 
                    id="categoryColor" 
                    name="categoryColor" 
                    type="color"
                    defaultValue={selectedCategory?.color || '#0066cc'}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {selectedCategory ? 'Aggiorna' : 'Crea'} Categoria
                </Button>
              </div>
            </form>
          )}

          {/* Tutor Form */}
          {activeTab === 'tutors' && (
            <form onSubmit={handleTutorSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tutorName">Nome Completo</Label>
                  <Input 
                    id="tutorName" 
                    name="tutorName" 
                    defaultValue={selectedTutor?.name || ''}
                    required 
                    placeholder="Mario Rossi"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tutorEmail">Email</Label>
                  <Input 
                    id="tutorEmail" 
                    name="tutorEmail" 
                    type="email"
                    defaultValue={selectedTutor?.email || ''}
                    placeholder="mario.rossi@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tutorRole">Ruolo</Label>
                  <Input 
                    id="tutorRole" 
                    name="tutorRole" 
                    defaultValue={selectedTutor?.role || ''}
                    required 
                    placeholder="Senior Financial Advisor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorSpecialization">Specializzazione</Label>
                  <Input 
                    id="tutorSpecialization" 
                    name="tutorSpecialization" 
                    defaultValue={selectedTutor?.specialization || ''}
                    placeholder="Trading, Investimenti, Budgeting..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutorExperience">Esperienza</Label>
                <Input 
                  id="tutorExperience" 
                  name="tutorExperience" 
                  defaultValue={selectedTutor?.experience || ''}
                  placeholder="8 anni nel settore finanziario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tutorBio">Biografia</Label>
                <Textarea 
                  id="tutorBio" 
                  name="tutorBio" 
                  defaultValue={selectedTutor?.bio || ''}
                  rows={3}
                  placeholder="Descrivi l'esperienza e le competenze del tutor..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Tariffa Oraria (€)</Label>
                  <Input 
                    id="hourlyRate" 
                    name="hourlyRate" 
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedTutor?.hourlyRate || ''}
                    placeholder="50.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tutorRating">Rating</Label>
                  <Input 
                    id="tutorRating" 
                    name="tutorRating" 
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    defaultValue={selectedTutor?.rating || '0'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalReviews">Numero Recensioni</Label>
                  <Input 
                    id="totalReviews" 
                    name="totalReviews" 
                    type="number"
                    min="0"
                    defaultValue={selectedTutor?.totalReviews || '0'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedEmails">Email Clienti Assegnati</Label>
                <Textarea 
                  id="assignedEmails" 
                  name="assignedEmails" 
                  defaultValue={selectedTutor?.assignedEmails?.join(', ') || ''}
                  rows={3}
                  placeholder="esempio@email.com, altro@email.com, ..."
                />
                <p className="text-xs text-muted-foreground">
                  Inserisci le email dei clienti che possono vedere questo tutor, separate da virgole. Lascia vuoto per renderlo visibile a tutti.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="tutorActive" 
                  name="tutorActive"
                  defaultChecked={selectedTutor?.isActive !== false}
                />
                <Label htmlFor="tutorActive">Tutor Attivo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createTutorMutation.isPending || updateTutorMutation.isPending}>
                  {selectedTutor ? 'Aggiorna' : 'Crea'} Tutor
                </Button>
              </div>
            </form>
          )}

          {/* Lesson Form */}
          {activeTab === 'lessons' && selectedCourse && (
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lessonTitle">Titolo Lezione</Label>
                <Input 
                  id="lessonTitle" 
                  name="lessonTitle" 
                  defaultValue={selectedLesson?.title || ''}
                  required 
                  placeholder="Es. Introduzione al Trading, Analisi Tecnica..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lessonDescription">Descrizione</Label>
                <Textarea 
                  id="lessonDescription" 
                  name="lessonDescription" 
                  defaultValue={selectedLesson?.description || ''}
                  rows={3}
                  placeholder="Descrivi il contenuto della lezione..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Link Video (YouTube/Vimeo)</Label>
                <Input 
                  id="videoUrl" 
                  name="videoUrl" 
                  defaultValue={selectedLesson?.videoUrl || ''}
                  placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Incolla qui il link completo del video YouTube o Vimeo
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonCategory">Categoria</Label>
                  <select 
                    name="lessonCategory" 
                    defaultValue={selectedLesson?.categoryId?.toString()}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Nessuna categoria</option>
                    {filteredCategories.map((category: any) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {filteredCategories.length === 0 && selectedCourse && (
                    <p className="text-sm text-muted-foreground">
                      Nessuna categoria disponibile per questo corso. Crea prima una categoria.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonDuration">Durata (minuti)</Label>
                  <Input 
                    id="lessonDuration" 
                    name="lessonDuration" 
                    type="number"
                    defaultValue={selectedLesson?.duration || ''}
                    placeholder="15"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonOrder">Ordine</Label>
                  <Input 
                    id="lessonOrder" 
                    name="lessonOrder" 
                    type="number"
                    defaultValue={selectedLesson?.sortOrder || ''}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="lessonPublished" 
                  name="lessonPublished"
                  defaultChecked={selectedLesson?.isPublished || false}
                />
                <Label htmlFor="lessonPublished">Pubblica lezione</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createLessonMutation.isPending || updateLessonMutation.isPending}>
                  {selectedLesson ? 'Aggiorna' : 'Crea'} Lezione
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}