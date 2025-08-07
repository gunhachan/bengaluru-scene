export function humanDate(date) {
    const d = new Date(date);
    const suffix = d.getDate() === 1 ? "st" :
        d.getDate() === 2 ? "nd" :
            d.getDate() === 3 ? "rd" : "th";
    return `${d.getDate()}${suffix} ${d.toLocaleString('default', { month: 'long' })}`;
}

export function showTooltip(event, d) {
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div").attr("class", "tooltip");
    }

    tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`)
        .html(`
      <b>Event:</b> ${d.description}<br/>
      <b>Date:</b> ${humanDate(d.date)}<br/>
      <b>Location:</b> ${d.location}
    `)
        .style("opacity", 1);
}

export function hideTooltip() {
    d3.select(".tooltip").style("opacity", 0);
}
