"use client";

import React from 'react';
import { useI18n } from '@/context/i18n-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  PlusCircle,
  Mail,
  Phone,
  MessageCircle,
  Edit,
  Award,
  Target,
  TrendingUp,
  Clock,
  Search,
  MoreHorizontal,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AiInputDemo, { AiInputDemoRef } from '@/components/smoothui/examples/AiInputDemo';
import LanguageSwitcher from '@/components/common/language-switcher';
import { useQuizAnalytics } from '@/hooks/useQuizAnalytics';

type TeacherDashboardProps = {
  teacherId: string;
  teacherName?: string;
  onCreateRoom: () => void;
  onInviteStudent: (email: string) => void;
  onGenerateQuiz: () => void;
  currentRoom?: { id: string; passcode?: string | null; qr?: string | null } | null;
  onEndSession?: () => void;
  onGoToRoom?: () => void;
};

// Mock data (static fallbacks)
const mockTeacherData = {
  profile: {
    name: "Madhavendra Singh Shaktawat",
    email: "madhavendra@example.com",
    phone: "+1 (555) 987-6543",
    address: "456 Teaching Ave, Education City"
  },
  analytics: {
    totalStudents: 24,
    activeRooms: 3,
    quizCompletions: 156,
    avgScore: 78
  },
  recentQuizzes: [
    {
      id: 1,
      title: "Addition Quiz",
      description: "Test your addition skills!",
      subject: "Maths",
      class: "2",
      difficulty: "medium",
      questions: 5,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Geometry Quiz",
      description: "Basic geometry concepts",
      subject: "Maths", 
      class: "8",
      difficulty: "medium",
      questions: 5,
      createdAt: "2024-01-14"
    },
    {
      id: 3,
      title: "Geography Quiz - Continents and Oceans",
      description: "Learn about world geography",
      subject: "Geography",
      class: "8", 
      difficulty: "medium",
      questions: 5,
      createdAt: "2024-01-13"
    }
  ],
  quickActions: [
    {
      id: "create-room",
      titleKey: "dashboard.teacher.createRoom",
      descriptionKey: "dashboard.teacher.createRoomDesc",
      icon: PlusCircle,
      color: "bg-blue-500"
    },
    {
      id: "invite-students", 
      titleKey: "dashboard.teacher.inviteStudents",
      descriptionKey: "dashboard.teacher.inviteStudentsDesc",
      icon: Users,
      color: "bg-green-500"
    },
    {
      id: "generate-quiz",
      titleKey: "dashboard.teacher.generateQuiz",
      descriptionKey: "dashboard.teacher.generateQuizDesc",
      icon: BookOpen,
      color: "bg-purple-500"
    }
  ]
};

export default function TeacherDashboard({ teacherId, teacherName, onCreateRoom, onInviteStudent, onGenerateQuiz, currentRoom, onEndSession, onGoToRoom }: TeacherDashboardProps) {
  const { t } = useI18n();
  const [totalStudents, setTotalStudents] = React.useState<number>(mockTeacherData.analytics.totalStudents);
  const [activeRooms, setActiveRooms] = React.useState<number>(mockTeacherData.analytics.activeRooms);
  
  // Ref for AI input component
  const aiInputRef = React.useRef<AiInputDemoRef>(null);
  
  // Quiz analytics
  const { analytics, loading: analyticsLoading, error: analyticsError } = useQuizAnalytics({ timeRange: '7d' });


  React.useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      try {
        const { count: studentsCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student')
          .eq('teacher_id', teacherId);
        if (isMounted && typeof studentsCount === 'number') setTotalStudents(studentsCount);

        // Count rooms created by this teacher (using created_by field)
        // This is the best we can do with current schema
        const { count: roomsCount } = await supabase
          .from('rooms')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', teacherName || '');
        if (isMounted && typeof roomsCount === 'number') setActiveRooms(roomsCount);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    }
    fetchCounts();

    const channel = supabase
      .channel('teacher-dashboard')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: `teacher_id=eq.${teacherId}` 
      }, () => {
        fetchCounts();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, () => {
        // Refresh counts when any room changes (create/delete)
        fetchCounts();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [teacherId, teacherName]);

  // Expose refresh function for manual updates
  const refreshCounts = React.useCallback(async () => {
    try {
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('teacher_id', teacherId);
      setTotalStudents(studentsCount || 0);

      const { count: roomsCount } = await supabase
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', teacherName || '');
      setActiveRooms(roomsCount || 0);
    } catch (error) {
      console.error('Error refreshing counts:', error);
    }
  }, [teacherId, teacherName]);

  // Refresh counts when currentRoom changes (e.g., when session ends)
  React.useEffect(() => {
    refreshCounts();
  }, [currentRoom?.id, refreshCounts]);


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("dashboard.teacher.title")}</h1>
          <p className="text-gray-600 mt-1">{t("dashboard.teacher.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder={t("dashboard.common.searchPlaceholder")} 
              className="pl-10 w-64"
            />
          </div>
          <LanguageSwitcher />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              MS
            </div>
            <div className="text-sm">
              <div className="font-medium">Madhavendra Singh</div>
              <div className="text-gray-500">Teacher</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Room (if any) */}
      {currentRoom?.id && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Room</span>
              <span className="text-sm font-normal text-gray-600">Passcode: <span className="font-mono font-semibold">{currentRoom.passcode ?? '—'}</span></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {currentRoom.qr ? (
                <img src={currentRoom.qr} alt="Room QR" className="w-32 h-32 border rounded" />
              ) : (
                <div className="w-32 h-32 border rounded bg-gray-50 flex items-center justify-center text-gray-400 text-xs">QR</div>
              )}
              <div className="flex-1 space-y-2">
                <div className="text-sm">Room ID: <span className="font-mono">{currentRoom.id}</span></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onGoToRoom && onGoToRoom()}>Go to Room</Button>
                  {onEndSession && (
                    <Button variant="outline" onClick={() => onEndSession()} className="text-red-600 hover:text-red-700">End Session</Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockTeacherData.quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Card key={action.id} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
              <CardHeader className="flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t(action.titleKey)}</CardTitle>
                    <p className="text-sm text-gray-600">{t(action.descriptionKey)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  className="w-full"
                  onClick={() => {
                    if (action.id === 'create-room') onCreateRoom();
                    if (action.id === 'invite-students') {
                      const email = window.prompt('Enter student email to invite');
                      if (email) onInviteStudent(email);
                    }
                    if (action.id === 'generate-quiz') {
                      // Open quiz generation modal via AI input
                      if (aiInputRef.current) {
                        aiInputRef.current.openQuizGenerationModal();
                      }
                    }
                  }}
                >
                  {t(action.titleKey)}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
                <div className="text-sm text-gray-600">{t("dashboard.teacher.totalStudents")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{activeRooms}</div>
                <div className="text-sm text-gray-600">{t("dashboard.teacher.activeRooms")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsLoading ? '...' : analytics?.totalResponses || 0}
                </div>
                <div className="text-sm text-gray-600">{t("dashboard.teacher.quizCompletions")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsLoading ? '...' : `${analytics?.averageScore || 0}%`}
                </div>
                <div className="text-sm text-gray-600">{t("dashboard.teacher.avgScore")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quizzes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("dashboard.teacher.recentQuizzes")}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Found {mockTeacherData.recentQuizzes.length} quiz(es)</span>
            <Button variant="outline" size="sm" onClick={refreshCounts}>
              <RefreshCw className="w-4 h-4 mr-1" />
              {t("dashboard.common.refresh")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTeacherData.recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{quiz.title}</div>
                    <div className="text-sm text-gray-600">{quiz.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Subject: {quiz.subject} • Class: {quiz.class} • Difficulty: {quiz.difficulty} • Questions: {quiz.questions}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("dashboard.common.delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Latest Quiz */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.teacher.recentQuizzes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{mockTeacherData.recentQuizzes[0].title}</h3>
                <p className="text-sm text-gray-600">Question 1 / 5</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  {t("dashboard.common.prev")}
                </Button>
                <Button variant="outline" size="sm">
                  {t("dashboard.common.next")}
                </Button>
              </div>
            </div>
            
            {/* Mock Quiz Question */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-lg font-medium mb-4">
                What is 5 + 3?
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>A) 6</span>
                </div>
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>B) 7</span>
                </div>
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>C) 8</span>
                </div>
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer">
                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                  <span>D) 9</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Analytics Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Quiz Analytics (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading analytics...</div>
            </div>
          ) : analyticsError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-500">Error loading analytics: {analyticsError}</div>
            </div>
          ) : analytics && analytics.totalResponses > 0 ? (
            <div className="space-y-6">
              {/* Top Performing Quizzes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Performing Quizzes</h3>
                <div className="space-y-3">
                  {analytics.quizStats.slice(0, 3).map((quiz, index) => (
                    <div key={quiz.quizId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{quiz.quizTitle}</div>
                        <div className="text-sm text-gray-600">
                          {quiz.totalResponses} responses • {quiz.uniqueStudents} students
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{quiz.averageScore.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Avg Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Students */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Performing Students</h3>
                <div className="space-y-3">
                  {analytics.studentStats.slice(0, 5).map((student, index) => (
                    <div key={student.studentId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{student.studentName}</div>
                        <div className="text-sm text-gray-600">
                          {student.totalQuizzes} quizzes completed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{student.averageScore.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Avg Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Quiz Activity</h3>
                <div className="space-y-3">
                  {analytics.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{activity.studentName}</div>
                        <div className="text-sm text-gray-600">
                          Completed "{activity.quizTitle}" in {activity.roomName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.completedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {activity.score}/{activity.totalQuestions}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round((activity.score / activity.totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wrong Answer Analytics */}
              {analytics.wrongAnswerStats && analytics.wrongAnswerStats.totalWrongAnswers > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Common Wrong Answers</h3>
                  <div className="space-y-3">
                    {analytics.wrongAnswerStats.mostCommonWrongAnswers.slice(0, 5).map((wrongAnswer, index) => (
                      <div key={`${wrongAnswer.quizId}-${wrongAnswer.questionId}`} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-red-800">{wrongAnswer.questionText}</div>
                            <div className="text-sm text-red-600 mt-1">{wrongAnswer.quizTitle}</div>
                            <div className="text-sm text-red-500 mt-2">
                              Wrong {wrongAnswer.totalWrong} times
                            </div>
                            <div className="mt-2 space-y-1">
                              {wrongAnswer.wrongAnswers.slice(0, 3).map((wa, idx) => (
                                <div key={idx} className="text-xs text-red-600">
                                  <span className="font-medium">{wa.studentName}:</span> "{wa.studentAnswer}" 
                                  <span className="text-red-500 ml-1">(Correct: "{wa.correctAnswer}")</span>
                                </div>
                              ))}
                              {wrongAnswer.wrongAnswers.length > 3 && (
                                <div className="text-xs text-red-500">
                                  +{wrongAnswer.wrongAnswers.length - 3} more...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500">No quiz data yet</div>
                <div className="text-sm text-gray-400 mt-1">Create and share quizzes to see analytics here</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Input Demo - Fixed position in bottom right */}
      <div className="fixed bottom-4 right-4 z-50">
        <AiInputDemo ref={aiInputRef} roomId={currentRoom?.id} />
      </div>
    </div>
  );
}
