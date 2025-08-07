import { drawChart } from "./chart.js";
import { emojiMap } from "./assets/emojis.js";

let allData = [];
let selectedCategories = new Set();

function updateSelectedCategories() {
    if (selectedCategories.size === 0) {
        selectedCategories = new Set(Object.keys(emojiMap));
    }
}

// Render top filter buttons
function renderFilterBar() {
    const filterBar = d3.select("#filter-bar");
    filterBar.selectAll("*").remove();

    const categories = Object.keys(emojiMap);

    categories.forEach(cat => {
        filterBar.append("button")
            .attr("class", "filter-button active")
            .attr("data-category", cat)
            .html(`${emojiMap[cat]} ${cat}`)
            .on("click", function () {
                const btn = d3.select(this);
                if (btn.classed("active")) {
                    btn.classed("active", false);
                    selectedCategories.delete(cat);
                } else {
                    btn.classed("active", true);
                    selectedCategories.add(cat);
                }
                if (selectedCategories.size === 0) {
                    btn.classed("active", true);
                    selectedCategories.add(cat);
                    return;
                }
                updateMarkOpacity();
            });
    });
}

// Render sticky X axis bar below filter bar
function renderXAxisBar() {
    const xAxisBar = d3.select("#x-axis-bar");
    const times = [];
    for (let h = 0; h <= 24; h += 2) {
        const label = `${h}:00`;
        times.push(label);
    }

    xAxisBar.selectAll("span").remove();
    xAxisBar.selectAll("span")
        .data(times)
        .join("span")
        .style("flex", "1")
        .style("text-align", (d, i) => (i === 0 ? "left" : i === times.length - 1 ? "right" : "center"))
        .text(d => d);

    // Dynamically set width to match #chart-wrapper width and center horizontally
    const wrapperWidth = document.getElementById("chart-wrapper").clientWidth;
    xAxisBar.style("width", wrapperWidth + "px")
        .style("margin", "0 auto");
}

function updateMarkOpacity() {
    d3.selectAll(".event-dot")
        .style("opacity", d => selectedCategories.has(d.category) ? 1 : 0.2);
}

// Load data & initialize
d3.csv("data.csv").then(data => {
    data.forEach(d => {
        d.timeMinutes = parseInt(d.time.split(":")[0]) * 60 + parseInt(d.time.split(":")[1]);
        d.dateObj = new Date(d.date);
    });
    allData = data;
    selectedCategories = new Set(Object.keys(emojiMap)); // select all by default
    renderFilterBar();
    renderXAxisBar();
    drawChart(allData);
    updateMarkOpacity();

    // Update X axis bar width on window resize
    window.addEventListener("resize", () => {
        renderXAxisBar();
    });
});

