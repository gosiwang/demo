// PerformanceVisualizations.jsx
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const PerformanceVisualizations = () => {
  // 더미 데이터
  const submissionAccuracyData = [
    { name: '정답', value: 75 },
    { name: '오답', value: 25 },
  ];
  // 3D 느낌의 현대적인 색상 팔레트
  const COLORS = ['#1E90FF', '#FF6347'];

  const solvedProblemsData = [
    { date: '2025-03-25', solved: 3 },
    { date: '2025-03-26', solved: 5 },
    { date: '2025-03-27', solved: 2 },
    { date: '2025-03-28', solved: 6 },
    { date: '2025-03-29', solved: 4 },
  ];

  const submissionStats = {
    totalSubmissions: 50,
    solvedProblems: 35,
    accuracyRate: 70, // %
  };

  // 공통 카드 스타일 (입체적 효과와 네오무픽 디자인)
  const cardStyle = {
    background: 'linear-gradient(145deg, #ffffff, #e0e0e0)',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '6px 6px 12px #d1d1d1, -6px -6px 12px #ffffff',
    margin: '15px',
    border: '1px solid #dfe4ea',
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '30px',
        background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
        borderRadius: '16px',
        boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)',
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '28px',
          fontWeight: '700',
          color: '#333',
        }}
      >
        성능 시각화
      </h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        {/* 코드 제출 정답률 파이차트 카드 */}
        <div style={{ ...cardStyle, flex: '1 1 300px', maxWidth: '500px' }}>
          <h3
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600',
              color: '#444',
            }}
          >
            코드 제출 정답률
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={submissionAccuracyData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {submissionAccuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 일별 푼 문제 수 바 차트 카드 */}
        <div style={{ ...cardStyle, flex: '1 1 300px', maxWidth: '500px' }}>
          <h3
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              fontSize: '20px',
              fontWeight: '600',
              color: '#444',
            }}
          >
            일별 푼 문제 수
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={solvedProblemsData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#32CD32" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#32CD32" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="date" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                <Bar dataKey="solved" fill="url(#barGradient)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 요약 정보 카드 */}
      <div style={{ ...cardStyle, marginTop: '30px' }}>
        <h3
          style={{
            textAlign: 'center',
            marginBottom: '20px',
            fontSize: '20px',
            fontWeight: '600',
            color: '#444',
          }}
        >
          요약
        </h3>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '16px',
            color: '#333',
          }}
        >
          <p>
            <strong>총 코드 제출 횟수:</strong> {submissionStats.totalSubmissions}
          </p>
          <p>
            <strong>총 푼 문제 수:</strong> {submissionStats.solvedProblems}
          </p>
          <p>
            <strong>정답률:</strong> {submissionStats.accuracyRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceVisualizations;
