import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export interface ProgressChartProps {
  progress?: number
  data?: { date: string; score: number }[]
}

const ProgressChart: React.FC<ProgressChartProps> = ({ progress, data }) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 40 }
    const width = 400 - margin.left - margin.right
    const height = 200 - margin.top - margin.bottom

    // Use either progress or data for rendering
    const chartData = data || Array.from({ length: 100 }, (_, i) => ({
      date: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000),
      score: i + 1
    })).filter(d => d.score <= (progress || 0))

    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date) as [Date, Date])
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0])

    const line = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.score))
      .curve(d3.curveMonotoneX)

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Add gradient
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0)

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.1)

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3b82f6")
      .attr("stop-opacity", 0.8)

    // Add area
    const area = d3.area<any>()
      .x(d => xScale(d.date))
      .y0(height)
      .y1(d => yScale(d.score))
      .curve(d3.curveMonotoneX)

    g.append("path")
      .datum(chartData)
      .attr("fill", "url(#line-gradient)")
      .attr("d", area)

    // Add line
    g.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line)

    // Add dots
    g.selectAll(".dot")
      .data(chartData)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.score))
      .attr("r", 4)
      .attr("fill", "#3b82f6")

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d")))

    g.append("g")
      .call(d3.axisLeft(yScale))

  }, [progress, data])

  if (typeof progress === 'number') {
    // Simple progress bar
    return (
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-blue-500 h-3 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    )
  }
  if (Array.isArray(data)) {
    // Simple line chart (replace with D3.js or chart lib for real use)
    return (
      <div className="w-full h-32 bg-gray-100 rounded flex items-end p-2">
        {data.map((point, idx) => (
          <div
            key={idx}
            title={`${point.date}: ${point.score}%`}
            style={{
              height: `${point.score}%`,
              width: '12%',
              background: '#3b82f6',
              marginRight: '2px',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>
    )
  }
  return null

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Quiz Score Progress</h3>
      <svg ref={svgRef} width={400} height={200} />
    </div>
  )
}

export default ProgressChart