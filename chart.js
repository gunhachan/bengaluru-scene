import { emojiMap } from "./assets/emojis.js";
import { humanDate, showTooltip, hideTooltip } from "./utils.js";

export function drawChart(data) {
    const svg = d3.select("#chart");
    const width = 688;  // updated width to match x-axis bar
    const margin = { top: 50, right: 50, bottom: 50, left: 100 };
    const rowHeight = 40;

    if (data.length === 0) {
        svg.selectAll("*").remove();
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .text("No events in selected categories");
        return;
    }

    // Unique dates sorted
    let uniqueDates = Array.from(new Set(data.map(d => d.dateObj.toDateString())))
        .map(d => new Date(d))
        .sort((a, b) => a - b);

    // Fixed height for chart (all dates)
    const height = uniqueDates.length * rowHeight + margin.top + margin.bottom;
    svg.attr("width", width).attr("height", height);

    svg.selectAll("*").remove();

    // Scales
    const x = d3.scaleLinear()
        .domain([0, 24 * 60])
        .range([margin.left, width - margin.right]);

    const y = d3.scalePoint()
        .domain(uniqueDates.map(d => d.toDateString()))
        .range([margin.top, height - margin.bottom])
        .padding(0.5);

    // White background
    svg.append("rect")
        .attr("x", 0).attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white");

    // Midday vertical dashed line at 12:00
    svg.append("line")
        .attr("class", "midday-line")
        .attr("x1", x(12 * 60))
        .attr("x2", x(12 * 60))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom);

    // X axis top
    const xAxis = d3.axisTop(x)
        .ticks(12)
        .tickFormat(d => {
            let hour = Math.floor(d / 60);
            return `${hour}:00`;
        });

    svg.append("g")
        .attr("class", "x-axis top")
        .attr("transform", `translate(0, ${margin.top})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "x-axis bottom")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis);

    // Weekly grid lines every 7 days
    const firstDate = uniqueDates[0];
    const weeklyTicks = uniqueDates.filter(date => {
        const diffDays = Math.round((date - firstDate) / (1000 * 60 * 60 * 24));
        return diffDays % 7 === 0;
    });
    const yTicks = weeklyTicks.map(d => d.toDateString());

    svg.selectAll(".grid-line")
        .data(yTicks)
        .enter()
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d));

    // Y ticks (day numbers) every 3 days for clarity
    const yTickEveryN = 3;
    svg.selectAll(".y-label")
        .data(uniqueDates.filter((_, i) => i % yTickEveryN === 0))
        .enter()
        .append("text")
        .attr("class", "y-label")
        .attr("x", margin.left - 10)
        .attr("y", d => y(d.toDateString()) + 4)
        .attr("text-anchor", "end")
        .text(d => d.getDate());

    // Month/year labels
    const months = [];
    let currentMonth = null;
    uniqueDates.forEach(date => {
        const monthYear = date.toLocaleString('default', { year: 'numeric', month: 'long' });
        if (monthYear !== currentMonth) {
            months.push({ label: monthYear, date });
            currentMonth = monthYear;
        }
    });

    svg.selectAll(".month-label")
        .data(months)
        .enter()
        .append("text")
        .attr("class", "month-label")
        .attr("x", 10)
        .attr("y", d => y(d.date.toDateString()) + 15)
        .text(d => d.label);

    // Calculate dodge offsets for events that share the same time+date
    const groupedEvents = {};
    data.forEach(d => {
        const key = d.dateObj.toDateString() + "-" + d.timeMinutes;
        if (!groupedEvents[key]) groupedEvents[key] = [];
        groupedEvents[key].push(d);
    });

    const maxDodge = 5;
    const dodgeWidth = 12;
    const dodgeHeight = 4;

    const eventDodgeIndex = new Map();
    Object.values(groupedEvents).forEach(events => {
        events.forEach((d, i) => {
            eventDodgeIndex.set(d, i);
        });
    });

    // Draw emoji marks
    svg.selectAll(".event-dot")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "event-dot")
        .attr("x", d => {
            const baseX = x(d.timeMinutes);
            const dodgeIndex = eventDodgeIndex.get(d);
            const offset = (dodgeIndex - (Math.min(groupedEvents[d.dateObj.toDateString() + "-" + d.timeMinutes].length, maxDodge) - 1) / 2) * dodgeWidth;
            return baseX + offset;
        })
        .attr("y", d => {
            const baseY = y(d.dateObj.toDateString()) + 5;
            const dodgeIndex = eventDodgeIndex.get(d);
            return baseY + ((dodgeIndex % 2) * dodgeHeight);
        })
        .attr("font-size", 16)
        .attr("text-anchor", "middle")
        .text(d => emojiMap[d.category] || "•")
        .on("mouseover", (event, d) => {
            showTooltip(event, d);
        })
        .on("mouseout", hideTooltip);

    // --- Floating story text boxes ---

    const storyTexts = [
        "There's more to do in the evening time!",
        "Bangalore's arts scene is vibrant and growing.",
        "Meetups and social events keep the community connected.",
        "Fitness and wellness events are on the rise.",
        "Food and drink festivals spice up the weekends."
    ];

    // Clear old story boxes if any
    d3.select("#chart-wrapper").selectAll(".story-box").remove();

    // Add floating story boxes positioned evenly, shifted to the right of chart
    const chartWrapper = d3.select("#chart-wrapper");
    const wrapperHeight = height + margin.top + margin.bottom;

    storyTexts.forEach((text, i) => {
        chartWrapper.append("div")
            .attr("class", "story-box")
            .style("position", "absolute")
            .style("left", "800px")
            .style("top", `${margin.top + i * (wrapperHeight / storyTexts.length)}px`)
            .style("width", "350px")
            .style("padding", "10px 15px")
            .style("background", "rgba(255, 255, 255, 0.95)")
            .style("border-radius", "8px")
            .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
            .style("opacity", "0")
            .style("transition", "opacity 0.6s ease")
            .text(text);
    });

    // Intersection observer to fade in story boxes on scroll
    const storyBoxes = document.querySelectorAll(".story-box");
    const options = {
        root: null,
        rootMargin: "0px",
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
            } else {
                entry.target.style.opacity = "0";
            }
        });
    }, options);

    storyBoxes.forEach(box => observer.observe(box));
}


