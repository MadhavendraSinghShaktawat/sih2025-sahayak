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
  Calendar, 
  Clock, 
  TrendingUp,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  MessageCircle,
  Edit,
  Award,
  Target
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import LanguageSwitcher from '@/components/common/language-switcher';
import { useQuizResponses } from '@/hooks/useQuizResponses';

type StudentDashboardProps = {
  onJoinRoom: (code: string) => void;
};

// Mock data
const mockStudentData = {
  profile: {
    name: "Ava Mitchell",
    id: "STU-005",
    status: "Active",
    enrollmentDate: "Jan 30, 2028",
    email: "ava.mitchell@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Learning St, Education City",
    social: {
      linkedin: "ava-mitchell-edu",
      twitter: "@avamitchell",
      instagram: "@ava_mitchell"
    }
  },
  learningActivity: {
    totalHours: "42 hours 30 minutes",
    weeklyData: [
      { day: "Mon", hours: 6 },
      { day: "Tue", hours: 4 },
      { day: "Wed", hours: 8 },
      { day: "Thu", hours: 5 },
      { day: "Fri", hours: 7 },
      { day: "Sat", hours: 3 },
      { day: "Sun", hours: 2 }
    ],
    courses: [
      { name: "French for Beginners", hours: 16 },
      { name: "Business Communication", hours: 10.5 }
    ]
  },
  performance: {
    totalScore: 80,
    breakdown: [
      { label: "Participation", percentage: 55, color: "bg-pink-500" },
      { label: "Quiz", percentage: 15, color: "bg-yellow-500" },
      { label: "Exam", percentage: 10, color: "bg-blue-500" }
    ],
    trend: [
      { month: "Jan", score: 75 },
      { month: "Feb", score: 78 },
      { month: "Mar", score: 82 },
      { month: "Apr", score: 80 },
      { month: "May", score: 85 },
      { month: "Jun", score: 80 },
      { month: "Jul", score: 80 }
    ]
  },
  enrolledCourses: [
    {
      id: 1,
      name: "French for Beginners",
      type: "Language Beginner",
      progress: 60,
      hours: "15 - 25h",
      status: "Ongoing",
      score: "78/100",
      certificate: "None"
    },
    {
      id: 2,
      name: "Spanish Beginner",
      type: "Language Beginner", 
      progress: 100,
      hours: "20 - 30h",
      status: "Completed",
      score: "85/100",
      certificate: "Spanish Beginner"
    }
  ]
};

export default function StudentDashboard({ onJoinRoom }: StudentDashboardProps) {
  const { t } = useI18n();
  const [passcode, setPasscode] = React.useState<string>("");
  const { responses: quizResponses, loading: quizLoading, error: quizError } = useQuizResponses();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("dashboard.student.title")}</h1>
          <p className="text-gray-600 mt-1">{t("dashboard.student.subtitle")}</p>
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
              AM
            </div>
            <div className="text-sm">
              <div className="font-medium">Ava Mitchell</div>
              <div className="text-gray-500">Student</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Details Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-0">
            <div className="h-20 bg-gradient-to-r from-pink-400 to-pink-500 rounded-t-lg -m-6 mb-4"></div>
            <div className="flex justify-center -mt-16 mb-4">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
                  AM
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {mockStudentData.profile.id}
                </span>
                <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                  {mockStudentData.profile.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{mockStudentData.profile.name}</h3>
              <p className="text-sm text-gray-600">Enrolled on {mockStudentData.profile.enrollmentDate}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-3">
              <Button size="sm" variant="outline" className="rounded-full">
                <Mail className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="rounded-full">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="sm" className="rounded-full">
                <MessageCircle className="w-4 h-4 mr-1" />
                {t("dashboard.common.chat")}
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">{t("dashboard.common.email")}</div>
                  <div className="text-sm text-gray-600">{mockStudentData.profile.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">{t("dashboard.common.phone")}</div>
                  <div className="text-sm text-gray-600">{mockStudentData.profile.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">{t("dashboard.common.address")}</div>
                  <div className="text-sm text-gray-600">{mockStudentData.profile.address}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">Social Media</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">{t("dashboard.common.linkedin")}</div>
                    <div className="text-sm text-gray-600">{mockStudentData.profile.social.linkedin}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">{t("dashboard.common.twitter")}</div>
                    <div className="text-sm text-gray-600">{mockStudentData.profile.social.twitter}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">{t("dashboard.common.instagram")}</div>
                    <div className="text-sm text-gray-600">{mockStudentData.profile.social.instagram}</div>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              {t("dashboard.common.edit")}
            </Button>
          </CardContent>
        </Card>

        {/* Learning Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.student.learningActivity")}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{mockStudentData.learningActivity.totalHours}</span>
              <Button variant="outline" size="sm">
                {t("dashboard.student.thisWeek")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>0h</span>
                  <span>2h</span>
                  <span>4h</span>
                  <span>6h</span>
                  <span>8h</span>
                </div>
                <div className="flex items-end gap-1 h-20">
                  {mockStudentData.learningActivity.weeklyData.map((day, index) => (
                    <div key={day.day} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-gradient-to-t from-pink-500 to-yellow-500 rounded-t"
                        style={{ height: `${(day.hours / 8) * 100}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Summaries */}
              <div className="space-y-2">
                {mockStudentData.learningActivity.courses.map((course, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{course.hours} Hours</span> {course.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.student.performance")}</CardTitle>
            <Button variant="outline" size="sm">
              {t("dashboard.student.last6Months")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Donut Chart */}
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-8 border-pink-500" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%)' }}></div>
                  <div className="absolute inset-0 rounded-full border-8 border-yellow-500" style={{ clipPath: 'polygon(50% 50%, 0% 0%, 0% 50%)' }}></div>
                  <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'polygon(50% 50%, 0% 50%, 0% 100%)' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold">{t("dashboard.student.totalScore")}</div>
                      <div className="text-2xl font-bold">{mockStudentData.performance.totalScore}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {mockStudentData.performance.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>

              {/* Line Graph */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <div className="h-16 relative">
                  <svg className="w-full h-full">
                    <polyline
                      points="0,60 20,50 40,40 60,45 80,35 100,40 120,40"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Success is the sum of small efforts, repeated day in and day out. Keep pushing forward! 💪
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("dashboard.student.enrolledCourses")}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder={t("dashboard.student.searchCourse")} 
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              {t("dashboard.student.allStatus")}
            </Button>
            <Button variant="outline" size="sm">
              {t("dashboard.student.viewAll")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Join Room CTA row */}
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Join a Room</div>
                <div className="text-sm text-gray-600">Enter 6-digit code from your teacher</div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))}
                  className="w-28 text-center tracking-widest"
                />
                <Button onClick={() => passcode.length === 6 && onJoinRoom(passcode)} disabled={passcode.length !== 6}>
                  Join
                </Button>
              </div>
            </div>
            {mockStudentData.enrolledCourses.map((course) => (
              <div key={course.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{course.name}</div>
                  <div className="text-sm text-gray-600">{course.type}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                      {course.progress}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{course.hours}</div>
                  </div>
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.status === 'Ongoing' ? 'bg-green-100 text-green-800' :
                      course.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{course.score}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{course.certificate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiz History Card */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Quiz History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quizLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading quiz history...</div>
            </div>
          ) : quizError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-500">Error loading quiz history: {quizError}</div>
            </div>
          ) : quizResponses.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500">No quiz history yet</div>
                <div className="text-sm text-gray-400 mt-1">Complete quizzes to see your progress here</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {quizResponses.map((response) => (
                <div key={response.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{response.quiz.title}</div>
                    <div className="text-sm text-gray-600">
                      {response.quiz.subject} • Room {response.room.passcode}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Completed {new Date(response.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {response.score}/{response.total_questions}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {Math.round((response.score / response.total_questions) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Percentage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {Math.floor(response.time_taken / 60)}:{(response.time_taken % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-500">Time</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (response.score / response.total_questions) >= 0.8 ? 'bg-green-100 text-green-800' :
                      (response.score / response.total_questions) >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(response.score / response.total_questions) >= 0.8 ? 'Excellent' :
                       (response.score / response.total_questions) >= 0.6 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
