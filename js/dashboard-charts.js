// Chart instance and data
window.weeklyActivityChart = null;
window.chartData = {
    steps: {
        label: 'Steps',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
    },
    calories: {
        label: 'Calories Burned',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
    },
    workouts: {
        label: 'Workout Minutes',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
    }
};

// Function to initialize the chart
function initWeeklyActivityChart() {
    const canvas = document.getElementById('weeklyActivityChart');
    if (!canvas || window.weeklyActivityChart) {
        return;
    }
    
    try {
        const ctx = canvas.getContext('2d');
        
        window.weeklyActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Steps',
                    data: window.chartData.steps.data,
                    backgroundColor: window.chartData.steps.backgroundColor,
                    borderColor: window.chartData.steps.borderColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toLocaleString();
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

// Function to update the chart based on selected metric
function updateChart(metric) {
    if (!window.weeklyActivityChart) {
        initWeeklyActivityChart();
        if (!window.weeklyActivityChart) return;
    }
    
    const chart = window.weeklyActivityChart;
    const data = window.chartData[metric];
    
    chart.data.datasets[0].label = data.label;
    chart.data.datasets[0].data = data.data;
    chart.data.datasets[0].backgroundColor = data.backgroundColor;
    chart.data.datasets[0].borderColor = data.borderColor;
    
    if (metric === 'steps') {
        chart.options.scales.y.ticks.callback = function(value) {
            return value.toLocaleString();
        };
    } else if (metric === 'calories') {
        chart.options.scales.y.ticks.callback = function(value) {
            return value.toLocaleString() + ' kcal';
        };
    } else if (metric === 'workouts') {
        chart.options.scales.y.ticks.callback = function(value) {
            return value + ' min';
        };
    }
    
    chart.update();
} 