// Chart instance and data
let weeklyActivityChart;
const chartData = {
    steps: {
        label: 'Steps',
        data: [8421, 10254, 7592, 9873, 6420, 8532, 12045],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
    },
    calories: {
        label: 'Calories Burned',
        data: [1850, 2102, 1745, 2231, 1654, 1932, 2345],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
    },
    workouts: {
        label: 'Workout Minutes',
        data: [45, 60, 30, 75, 0, 45, 90],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
    }
};

// Function to initialize the chart
function initWeeklyActivityChart() {
    console.log('Initializing chart...');
    const canvas = document.getElementById('weeklyActivityChart');
    
    if (!canvas) {
        console.error('Canvas not found during initialization');
        return;
    }
    
    try {
        const ctx = canvas.getContext('2d');
        console.log('Canvas context obtained');
        
        // Set explicit dimensions to ensure visibility
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        weeklyActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                datasets: [{
                    label: 'Steps',
                    data: chartData.steps.data,
                    backgroundColor: chartData.steps.backgroundColor,
                    borderColor: chartData.steps.borderColor,
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
                                label += context.parsed.y.toLocaleString();
                                return label;
                            }
                        }
                    }
                }
            }
        });
        console.log('Chart initialization complete');
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

// Function to update the chart based on selected metric
function updateChart(metric) {
    console.log('Updating chart to metric:', metric);
    
    if (!weeklyActivityChart) {
        console.error('Chart instance not available');
        // Try to initialize the chart if it doesn't exist
        initWeeklyActivityChart();
        return;
    }
    
    try {
        // Update dataset with new data
        weeklyActivityChart.data.datasets[0].label = chartData[metric].label;
        weeklyActivityChart.data.datasets[0].data = chartData[metric].data;
        weeklyActivityChart.data.datasets[0].backgroundColor = chartData[metric].backgroundColor;
        weeklyActivityChart.data.datasets[0].borderColor = chartData[metric].borderColor;
        
        // Update y-axis formatting based on metric
        if (metric === 'steps') {
            weeklyActivityChart.options.scales.y.ticks.callback = function(value) {
                return value.toLocaleString();
            };
        } else if (metric === 'calories') {
            weeklyActivityChart.options.scales.y.ticks.callback = function(value) {
                return value.toLocaleString() + ' kcal';
            };
        } else if (metric === 'workouts') {
            weeklyActivityChart.options.scales.y.ticks.callback = function(value) {
                return value + ' min';
            };
        }
        
        // Update the chart
        weeklyActivityChart.update();
        console.log('Chart updated successfully');
    } catch (error) {
        console.error('Error updating chart:', error);
    }
} 