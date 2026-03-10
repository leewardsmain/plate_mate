import styles from './RadarChart.module.css';

interface RadarDataPoint {
    label: string;
    value: number;
}

interface RadarChartProps {
    data: RadarDataPoint[];
    size?: number;
}

export default function RadarChart({ data, size = 280 }: RadarChartProps) {
    if (data.length === 0) return null;

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 40; // leave room for labels
    const levels = 4;
    const n = data.length;
    const maxValue = Math.max(...data.map(d => d.value), 1);

    // Angle for each axis (start from top, go clockwise)
    const angleSlice = (2 * Math.PI) / n;

    // Get point on circle
    const pointOnCircle = (angle: number, r: number) => ({
        x: cx + r * Math.sin(angle),
        y: cy - r * Math.cos(angle),
    });

    // Background grid levels
    const gridLevels = Array.from({ length: levels }, (_, i) => {
        const levelRadius = (radius / levels) * (i + 1);
        const points = Array.from({ length: n }, (_, j) => {
            const p = pointOnCircle(j * angleSlice, levelRadius);
            return `${p.x},${p.y}`;
        }).join(' ');
        return { radius: levelRadius, points };
    });

    // Axis lines
    const axes = Array.from({ length: n }, (_, i) => {
        const end = pointOnCircle(i * angleSlice, radius);
        return { x1: cx, y1: cy, x2: end.x, y2: end.y };
    });

    // Data polygon
    const dataPoints = data.map((d, i) => {
        const r = (d.value / maxValue) * radius;
        const p = pointOnCircle(i * angleSlice, r);
        return `${p.x},${p.y}`;
    }).join(' ');

    // Label positions (slightly beyond radius)
    const labels = data.map((d, i) => {
        const labelRadius = radius + 22;
        const p = pointOnCircle(i * angleSlice, labelRadius);
        return { ...d, x: p.x, y: p.y };
    });

    return (
        <div className={styles.container}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Grid levels */}
                {gridLevels.map((level, i) => (
                    <polygon
                        key={`grid-${i}`}
                        points={level.points}
                        className={styles.gridLevel}
                    />
                ))}

                {/* Axis lines */}
                {axes.map((axis, i) => (
                    <line
                        key={`axis-${i}`}
                        x1={axis.x1} y1={axis.y1}
                        x2={axis.x2} y2={axis.y2}
                        className={styles.axisLine}
                    />
                ))}

                {/* Data polygon */}
                <polygon
                    points={dataPoints}
                    className={styles.dataPolygon}
                />

                {/* Data points */}
                {data.map((d, i) => {
                    const r = (d.value / maxValue) * radius;
                    const p = pointOnCircle(i * angleSlice, r);
                    return (
                        <circle
                            key={`dot-${i}`}
                            cx={p.x} cy={p.y} r={3.5}
                            className={styles.dataDot}
                        />
                    );
                })}

                {/* Labels */}
                {labels.map((label, i) => (
                    <text
                        key={`label-${i}`}
                        x={label.x}
                        y={label.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={styles.label}
                    >
                        {label.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}
