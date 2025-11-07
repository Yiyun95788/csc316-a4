let data = [];
let currentSample = [];

Papa.parse('dataset/subset.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function (results) {
        data = results.data.filter(d =>
            d.energy != null &&
            d.valence != null &&
            d.popularity != null
        );

        const slider  = document.getElementById('sample-slider');
        const valueEl = document.getElementById('sample-value');
        const total   = data.length;
        const step    = +slider.step || 1;

        const baseMaxCandidate = total - (total % step);
        const baseMax = (baseMaxCandidate === total) ? (total - step) : baseMaxCandidate;

        slider.max = baseMax + step;
        slider.value = 3000;

        function mapToSample(v) {
            return (v > baseMax) ? total : v;
        }

        function refresh() {
            const raw = +slider.value;
            const n   = mapToSample(raw);

            valueEl.textContent = n.toLocaleString();

            if (typeof updateChart === 'function' && updateChart.length >= 1) {
                updateChart(n);
            } else {
                window.__mappedN = n;
                updateChart();
            }
        }

        slider.addEventListener('input', refresh);

        document.getElementById('loading').style.display = 'none';
        document.getElementById('legend').style.display  = 'flex';
        document.getElementById('stats').style.display   = 'grid';

        refresh();
    }
});


const margin = {top: 30, right: 40, bottom: 70, left: 80};
const width = Math.min(1100, window.innerWidth - 100) - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const gridX = svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`);

const gridY = svg.append("g")
    .attr("class", "grid");

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const color = d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);

const xAxis = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`);

const yAxis = svg.append("g")
    .attr("class", "axis");

const xLabel = svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 50);

const yLabel = svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -55);

const tooltip = d3.select("#tooltip");

function updateChart() {
    const xFeature = document.getElementById('x-select').value;
    const yFeature = document.getElementById('y-select').value;
    const sampleSize = parseInt(document.getElementById('sample-slider').value);

    currentSample = data.sort(() => 0.5 - Math.random()).slice(0, sampleSize);

    x.domain(d3.extent(currentSample, d => d[xFeature]));
    y.domain(d3.extent(currentSample, d => d[yFeature]));

    gridX.transition().duration(750)
        .call(d3.axisBottom(x).tickSize(-height).tickFormat(''));
    
    gridY.transition().duration(750)
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(''));

    xAxis.transition().duration(750)
        .call(d3.axisBottom(x).ticks(10));
    
    yAxis.transition().duration(750)
        .call(d3.axisLeft(y).ticks(10));

    xLabel.text(formatLabel(xFeature));
    yLabel.text(formatLabel(yFeature));

    const circles = svg.selectAll("circle")
        .data(currentSample, d => d.track_id);

    circles.exit()
        .transition()
        .duration(400)
        .attr("r", 0)
        .remove();

    circles.enter()
        .append("circle")
        .attr("r", 0)
        .attr("cx", d => x(d[xFeature]))
        .attr("cy", d => y(d[yFeature]))
        .merge(circles)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("r", 7)
                .attr("stroke", "#000")
                .attr("stroke-width", 2);
            showTooltip(event, d);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", function(event, d) {
            d3.select(this)
                .attr("r", 5)
                .attr("stroke", "none");
            hideTooltip();
        })
        .transition()
        .duration(750)
        .attr("cx", d => x(d[xFeature]))
        .attr("cy", d => y(d[yFeature]))
        .attr("r", 5)
        .attr("fill", d => color(d.popularity))
        .attr("opacity", 0.7);

    updateStats();
}

function formatLabel(feature) {
    const labels = {
        'danceability': 'Danceability',
        'energy': 'Energy',
        'valence': 'Valence (Happiness)',
        'acousticness': 'Acousticness',
        'speechiness': 'Speechiness',
        'tempo': 'Tempo (BPM)'
    };
    return labels[feature];
}

function showTooltip(event, d) {
    tooltip.classed("show", true);
    tooltip.html(`
        <div class="tooltip-title">${d.track_name}</div>
        <strong>Artist:</strong> ${d.artist_name}<br>
        <strong>Popularity:</strong> ${d.popularity}/100<br>
        <strong>Energy:</strong> ${(d.energy * 100).toFixed(0)}%<br>
        <strong>Happiness:</strong> ${(d.valence * 100).toFixed(0)}%<br>
        <strong>Danceability:</strong> ${(d.danceability * 100).toFixed(0)}%
    `);
}

function moveTooltip(event) {
    tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 15) + "px");
}

function hideTooltip() {
    tooltip.classed("show", false);
}

function updateStats() {
    document.getElementById('songCount').textContent = currentSample.length.toLocaleString();
    document.getElementById('avgEnergy').textContent = 
        (d3.mean(currentSample, d => d.energy) * 100).toFixed(0) + '%';
    document.getElementById('avgValence').textContent = 
        (d3.mean(currentSample, d => d.valence) * 100).toFixed(0) + '%';
    document.getElementById('avgDance').textContent = 
        (d3.mean(currentSample, d => d.danceability) * 100).toFixed(0) + '%';
}

document.getElementById('x-select').addEventListener('change', updateChart);
document.getElementById('y-select').addEventListener('change', updateChart);
document.getElementById('sample-slider').addEventListener('input', function() {
    document.getElementById('sample-value').textContent = this.value;
});
document.getElementById('sample-slider').addEventListener('change', updateChart);

const sampleInfo = document.getElementById('sample-info');
const sampleTooltip = document.getElementById('sample-tooltip');

sampleInfo.addEventListener('mouseenter', function(e) {
    sampleTooltip.classList.add('show');
    positionTooltip(e);
});

sampleInfo.addEventListener('mousemove', positionTooltip);

sampleInfo.addEventListener('mouseleave', function() {
    sampleTooltip.classList.remove('show');
});

function positionTooltip(e) {
    sampleTooltip.style.left = (e.pageX + 10) + 'px';
    sampleTooltip.style.top = (e.pageY - 30) + 'px';
}