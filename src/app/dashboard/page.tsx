"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNodesState, useEdgesState } from "reactflow";
import ReactFlow from "reactflow";
import { Background, Controls } from "reactflow";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Clock,
  Code,
  TargetIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  MoveUpRight,
  SquareArrowOutUpRight,
  BookUser,
  BriefcaseBusiness,
  UserRoundCheck,
  LockIcon,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SparklesText from "@/components/ui/sparkles-text";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";

const ApexCharts = dynamic(() => import("react-apexcharts"), { ssr: false });

// Types
interface CompetencyData {
  time: string;
  accuracy: number;
  timeSpent: number;
  score: number;
}

interface Notification {
  id: number;
  message: string;
  mentor: string;
  avatar: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface Milestone {
  title: string;
  completed: boolean;
}

interface Goal {
  statement: string;
  description: string;
  timeframe: string;
  progress: number;
  milestones: Milestone[];
}

interface CommunityNotification {
  id: number;
  message: string;
  link: string;
}

interface Node {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  type?: string;
}

interface CustomEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  markerEnd: { type: string; id: string };
}

// Mock data
const competencyData: CompetencyData[] = [
  { time: "January", accuracy: 75, timeSpent: 120, score: 80 },
  { time: "February", accuracy: 82, timeSpent: 115, score: 85 },
  { time: "March", accuracy: 68, timeSpent: 130, score: 75 },
  { time: "April", accuracy: 90, timeSpent: 105, score: 93 },
  { time: "May", accuracy: 76, timeSpent: 125, score: 78 },
  { time: "June", accuracy: 88, timeSpent: 100, score: 89 },
  { time: "July", accuracy: 95, timeSpent: 85, score: 97 },
  { time: "August", accuracy: 81, timeSpent: 110, score: 84 },
  { time: "September", accuracy: 92, timeSpent: 95, score: 94 },
  { time: "October", accuracy: 98, timeSpent: 80, score: 99 },
  { time: "November", accuracy: 83, timeSpent: 115, score: 87 },
  { time: "December", accuracy: 96, timeSpent: 90, score: 98 },
];

const recentNotifications: Notification[] = [
  {
    id: 1,
    message: "Fantastic work on your React project!",
    mentor: "Rajesh Sharma",
    avatar: "https://i.pravatar.cc/150?u=rajeshsharma",
  },
  {
    id: 2,
    message: "Our mentoring session is scheduled for tomorrow",
    mentor: "Priya Mehta",
    avatar: "https://i.pravatar.cc/150?u=priyamehta",
  },
  {
    id: 3,
    message: "Reviewed your Node.js code. Let's discuss improvements.",
    mentor: "Amit Verma",
    avatar: "https://i.pravatar.cc/150?u=amitverma",
  },
];

const recentAchievements: Achievement[] = [
  {
    id: 1,
    title: "Algorithm Master",
    description: "Solved 100 algorithm challenges",
    icon: "🏆",
  },
  {
    id: 2,
    title: "Bug Squasher",
    description: "Fixed 50 critical bugs",
    icon: "🐛",
  },
  {
    id: 3,
    title: "Code Reviewer",
    description: "Reviewed 25 pull requests",
    icon: "👀",
  },
];

const goal: Goal = {
  statement: "Become a Skilled Entrepreneur in 6 Months",
  description:
    "Master traditional and modern tailoring techniques, build a portfolio of customized designs, and establish a local clientele by leveraging prashikshan programs and samudayik events.",
  timeframe: "By Q2 2024",
  progress: 45,
  milestones: [
    {
      title: "Complete DDUGKY-sponsored tailoring certification",
      completed: true,
    },
    {
      title: "Design and create 10 custom outfits for local clients",
      completed: true,
    },
    {
      title: "Participate in 2 local melas or exhibitions",
      completed: false,
    },
    {
      title: "Secure at least 5 regular clients",
      completed: false,
    },
    {
      title: "Master advanced embroidery (kadhai) and stitching techniques",
      completed: false,
    },
  ],
};

const communityNotifications: CommunityNotification[] = [
  {
    id: 1,
    message: "New coding challenge posted in the forum",
    link: "/forum/challenges",
  },
  {
    id: 2,
    message: 'Upcoming webinar on "Mastering React Hooks"',
    link: "/events/webinars",
  },
  {
    id: 3,
    message: "Community code review session this Friday",
    link: "/events/code-review",
  },
];

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "HTML/CSS" },
    type: "input",
  },
  { id: "2", position: { x: 200, y: 0 }, data: { label: "JavaScript" } },
  { id: "3", position: { x: 400, y: 0 }, data: { label: "React" } },
  { id: "4", position: { x: 600, y: 0 }, data: { label: "Node.js" } },
  { id: "5", position: { x: 800, y: 0 }, data: { label: "Express.js" } },
  { id: "6", position: { x: 1000, y: 0 }, data: { label: "Databases" } },
  { id: "7", position: { x: 200, y: 150 }, data: { label: "TypeScript" } },
  { id: "8", position: { x: 400, y: 150 }, data: { label: "Next.js" } },
  { id: "9", position: { x: 600, y: 150 }, data: { label: "GraphQL" } },
  { id: "10", position: { x: 800, y: 150 }, data: { label: "Docker" } },
  { id: "11", position: { x: 1000, y: 150 }, data: { label: "CI/CD" } },
];

const initialEdges: CustomEdge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e5-6",
    source: "5",
    target: "6",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e2-7",
    source: "2",
    target: "7",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e3-8",
    source: "3",
    target: "8",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e4-9",
    source: "4",
    target: "9",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e5-10",
    source: "5",
    target: "10",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
  {
    id: "e6-11",
    source: "6",
    target: "11",
    animated: true,
    markerEnd: { type: "arrowclosed", id: "arrow" },
  },
];

// Chart configuration for consistent theming
// const chartConfig = {
//   accuracy: {
//     label: "Accuracy",
//     color: "hsl(var(--chart-1))",
//   },
//   timeSpent: {
//     label: "Time Spent",
//     color: "hsl(var(--chart-2))",
//   },
//   score: {
//     label: "Score",
//     color: "hsl(var(--chart-3))",
//   },
// };

// Components
const CareerRoadmap: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(
    initialEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: edge.animated,
    }))
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">Career Roadmap</CardTitle>
        </div>
        <div className="text-sm text-gray-500">Interactive Learning Path</div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[350px] border border-gray-200 rounded-lg">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            className="rounded-lg"
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};

interface ScoreCardProps {
  title: string;
  score: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score }) => {
  const chartOptions = {
    chart: {
      height: 350,
      type: "radialBar" as const,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 225,
        hollow: {
          margin: 0,
          size: "70%",
          background: "#fff",
          position: "front" as const,
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.5,
          },
        },
        track: {
          background: "#fff",
          strokeWidth: "67%",
          margin: 0,
          dropShadow: {
            enabled: true,
            top: -3,
            left: 0,
            blur: 4,
            opacity: 0.7,
          },
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: "#888",
            fontSize: "17px",
          },
          value: {
            formatter: function (val: number) {
              return parseInt(val.toString()).toString();
            },
            color: "#111",
            fontSize: "36px",
            show: true,
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#ABE5A1"],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: "round" as const,
    },
    labels: ["Score"],
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">{score}%</div>
            <div className="text-sm text-gray-600">{title}</div>
          </div>
        </div>
        <div className="mt-4 h-32">
          <ApexCharts
            options={chartOptions}
            series={[score]}
            type="radialBar"
            height={128}
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface StrategicGoalProps {
  loading: boolean;
}

const StrategicGoal: React.FC<StrategicGoalProps> = ({ loading }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">Strategic Goal</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {goal?.statement}
            </h3>
            <p className="text-gray-600 text-sm mb-4">{goal?.description}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">
                {goal?.timeframe}
              </span>
              <span className="text-sm font-medium text-green-600">
                {goal?.progress}% Complete
              </span>
            </div>
            <Progress value={goal?.progress} className="mb-4" />
            <h4 className="font-semibold text-gray-700 mb-3">Key Milestones</h4>
            <ul className="space-y-2">
              {goal?.milestones.map((milestone, index) => (
                <li key={index} className="flex items-center">
                  <span
                    className={`mr-2 ${
                      milestone.completed ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    {milestone.completed ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <AlertCircleIcon className="w-4 h-4" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      milestone.completed ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
                    {milestone.title}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full text-sm">
          View Detailed Analysis
        </Button>
      </CardFooter>
    </Card>
  );
};

const LearningProgress: React.FC = () => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">Learning Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {goal?.statement}
        </h3>
        <Tabs defaultValue="competency" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="competency" className="text-sm">Competency</TabsTrigger>
            <TabsTrigger value="achievements" className="text-sm">Achievements</TabsTrigger>
          </TabsList>
          <TabsContent value="competency" className="mt-4">
            <div className="h-[280px]">
              <ApexCharts
                options={{
                  chart: {
                    height: 280,
                    type: "area",
                    toolbar: {
                      show: false,
                    },
                  },
                  dataLabels: {
                    enabled: false,
                  },
                  stroke: {
                    curve: "smooth",
                    width: 2,
                  },
                  xaxis: {
                    categories: competencyData.map(item => item.time.slice(0, 3)),
                    axisBorder: {
                      show: false,
                    },
                    axisTicks: {
                      show: false,
                    },
                  },
                  yaxis: {
                    show: false,
                  },
                  grid: {
                    show: false,
                  },
                  tooltip: {
                    x: {
                      format: "MMM",
                    },
                  },
                  colors: ["#3B82F6", "#10B981", "#F59E0B"],
                  legend: {
                    show: true,
                    position: "top",
                    horizontalAlign: "center",
                    fontSize: "12px",
                  },
                  fill: {
                    type: "gradient",
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.4,
                      opacityTo: 0.1,
                    },
                  },
                }}
                series={[
                  {
                    name: "Accuracy",
                    data: competencyData.map(item => item.accuracy),
                  },
                  {
                    name: "Time Spent",
                    data: competencyData.map(item => item.timeSpent),
                  },
                  {
                    name: "Score",
                    data: competencyData.map(item => item.score),
                  },
                ]}
                type="area"
                height={280}
              />
            </div>
          </TabsContent>
          <TabsContent value="achievements" className="mt-4">
            <div className="space-y-3">
              {recentAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="text-lg">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{achievement.title}</p>
                    <p className="text-xs text-gray-600">
                      {achievement.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ResumeWork: React.FC = () => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Resume Work</CardTitle>
            <CardDescription className="text-sm text-gray-600">Pick up where you left off</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 text-blue-700 p-3 rounded-lg">
              <Code className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">LeetCode Problem #217</p>
              <p className="text-sm text-gray-600">Contains Duplicate</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last session: Today, 2:30 PM (1h 45m)</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => null}>
          Resume Session
        </Button>
      </CardFooter>
    </Card>
  );
};

const Interventions: React.FC = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gray-300 opacity-70 z-10"></div>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <LockIcon className="w-16 h-16 text-gray-600" />
      </div>
      <Card className="bg-white flex-1 relative z-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            Training and Mentorship
          </CardTitle>
          <TargetIcon className="w-8 h-8 text-blue-500" />
        </CardHeader>
        <CardContent>
          <Separator className="mt-1 mb-2" />
          <div className="h-[250px] flex items-center justify-center">
            <div className="text-gray-500">Premium Feature</div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total minutes for the last 3 months
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

const SkillGapAnalysis: React.FC = () => {
  const radarData = [
    { skill: "Technical", current: 80, required: 90 },
    { skill: "Communication", current: 75, required: 85 },
    { skill: "Leadership", current: 60, required: 80 },
    { skill: "Problem Solving", current: 85, required: 90 },
    { skill: "Teamwork", current: 70, required: 85 },
    { skill: "Adaptability", current: 65, required: 80 },
  ];

  const radarOptions = {
    chart: {
      height: 250,
      type: "radar" as const,
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: radarData.map(item => item.skill),
    },
    yaxis: {
      stepSize: 20,
      max: 100,
      show: false,
    },
    colors: ["#3B82F6", "#EF4444"],
    legend: {
      show: true,
      position: "bottom" as const,
      fontSize: "12px",
    },
    fill: {
      opacity: 0.2,
    },
    markers: {
      size: 3,
    },
    grid: {
      show: false,
    },
  };

  const radarSeries = [
    {
      name: "Current Level",
      data: radarData.map(item => item.current),
    },
    {
      name: "Required Level",
      data: radarData.map(item => item.required),
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">Skill Gap Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[250px]">
          <ApexCharts
            options={radarOptions}
            series={radarSeries}
            type="radar"
            height={250}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 pt-4 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none text-gray-900">
          Improving consistently <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="flex items-center gap-2 leading-none text-gray-500">
          Last updated: Today
        </div>
      </CardFooter>
    </Card>
  );
};

const ProfileLinksCard: React.FC = () => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <SquareArrowOutUpRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">Profile</div>
            <div className="text-sm text-gray-600">Quick Links</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <UserRoundCheck className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">My Profile</span>
            </div>
            <Button variant="ghost" size="sm">
              <MoveUpRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <BookUser className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Resume</span>
            </div>
            <Button variant="ghost" size="sm">
              <MoveUpRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Portfolio</span>
            </div>
            <Button variant="ghost" size="sm">
              <MoveUpRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DiamondEvaluation: React.FC = () => {
  const evaluationData = [
    { category: "Self Evaluation", score: 85 },
    { category: "AI Inference", score: 78 },
    { category: "Mentor", score: 92 },
    { category: "Peer Review", score: 80 },
  ];

  const barOptions = {
    chart: {
      type: "bar" as const,
      height: 350,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        dataLabels: {
          position: "top" as const,
        },
      },
    },
    colors: ["#008FFB"],
    dataLabels: {
      enabled: true,
      offsetX: -6,
      style: {
        fontSize: "12px",
        colors: ["#fff"],
      },
    },
    xaxis: {
      categories: evaluationData.map(item => item.category),
      max: 100,
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      show: false,
    },
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900">Skill Evaluation</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[250px]">
          <ApexCharts
            options={barOptions}
            series={[
              {
                name: "Score",
                data: evaluationData.map(item => item.score),
              },
            ]}
            type="bar"
            height={250}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none text-gray-900">
          Consistent performance <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="leading-none text-gray-500">
          Evaluation scores across different methods
        </div>
      </CardFooter>
    </Card>
  );
};

const PersonalityAnalysis: React.FC = () => {
  const personalityOptions = {
    chart: {
      height: 200,
      type: "radar" as const,
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: [
        "Agreeableness",
        "Neuroticism", 
        "Openness",
        "Conscientiousness",
        "Extraversion"
      ],
    },
    yaxis: {
      stepSize: 20,
      max: 100,
      show: false,
    },
    colors: ["#8B5CF6"],
    markers: {
      size: 3,
      colors: ["#8B5CF6"],
      strokeColor: "#fff",
      strokeWidth: 1,
    },
    fill: {
      opacity: 0.2,
    },
    grid: {
      show: false,
    },
  };

  const personalitySeries = [
    {
      name: "Traits",
      data: [80, 50, 30, 40, 100],
    },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">Personality</div>
            <div className="text-sm text-gray-600">Analysis</div>
          </div>
        </div>
        <div className="h-[200px]">
          <ApexCharts
            options={personalityOptions}
            series={personalitySeries}
            type="radar"
            height={200}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const MentorNotifications: React.FC = () => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Mentor Notifications</CardTitle>
            <CardDescription className="text-sm text-gray-600">Recent messages from your mentors</CardDescription>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">3 new</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {recentNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={notification.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {notification.mentor[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.mentor}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                Reply
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CommunityUpdates: React.FC = () => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Community Updates</CardTitle>
            <CardDescription className="text-sm text-gray-600">Stay connected with your peers</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {communityNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => null}>
                View
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-md space-y-4"
          >
            <div className="h-6 w-3/4 bg-gray-200 rounded-md animate-pulse" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-full bg-gray-200 rounded-md animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility function to get greeting
const getGreeting = (hour: number): string => {
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Night";
};

// Main Dashboard Component
const DashboardPage: React.FC = () => {
  const currentHour = new Date().getHours();
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const greeting = getGreeting(currentHour);

  useEffect(() => {
    // Simulating data loading
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Welcome back!",
        description:
          "Your dashboard is ready. Let's continue your learning journey.",
      });
    }, 2000);
  }, [toast]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Get user name from localStorage with proper type checking
  const getUserName = (): string => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user@first");
      return storedName || "Cloudy";
    }
    return "Cloudy";
  };

  const userName = getUserName();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto space-y-6 p-6"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline">
            <h1 className="text-3xl font-bold text-gray-900">
              {`${greeting},`}&nbsp;
            </h1>
            <p className="text-3xl font-bold">
              <SparklesText text={userName} />
            </p>
          </div>
          <p className="text-gray-600 mt-1 font-medium">
            Here&apos;s a comprehensive view of your career journey
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{userName}</div>
              <div className="text-gray-500">Student</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Score Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard title="Profile Score" score={78} />
        <ScoreCard title="Placement Readiness" score={67} />
        <ProfileLinksCard />
        <PersonalityAnalysis />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategicGoal loading={loading} />
        <LearningProgress />
      </div>

      {/* Skills Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkillGapAnalysis />
        <DiamondEvaluation />
        <Interventions />
      </div>

      {/* Community and Resume Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumeWork />
        <CommunityUpdates />
      </div>

      {/* Mentor Notifications */}
      <div className="grid grid-cols-1 gap-6">
        <MentorNotifications />
      </div>

      {/* Career Roadmap - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <CareerRoadmap />
      </div>
    </motion.main>
  );
};

export default DashboardPage;
