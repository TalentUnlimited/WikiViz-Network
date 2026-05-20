// 1. Initialize DataSets for nodes and edges
// Using DataSets allows vis.js to automatically re-render when data changes
const nodes = new vis.DataSet([
	// { id: "API", label: "API", color: '#97C2FC' }
]);

const edges = new vis.DataSet([]);



// 3. Configuration options for the network
const options = {
	nodes: {
		shape: 'dot',
		size: 25,
		font: {
			size: 14,
			color: '#333333'
		},
		borderWidth: 2
	},
	edges: {
		smooth: {
		forceDirection: 'none'
		}
	},
	physics: {
		forceAtlas2Based: {
		springLength: 100
		},
		minVelocity: 0.75,
		solver: 'forceAtlas2Based'
	},
	interaction: {
		// zoomExtent sets the minimum and maximum zoom limits.
		// 1.0 is default size. 0.5 is pulled back. 
		// Setting max to 0.75 prevents it from zooming in too tight initially.
		zoomExtent: { min: 0.1, max: 0.2 } 
	}
};

// 4. Target the HTML container and draw the initial network
const container = document.getElementById('network-container');
const data = { nodes: nodes, edges: edges };
const network = new vis.Network(container, data, options);

const parameter_div = document.getElementById("parameter-content");
const article_title = document.getElementById("article-title");

// 5. Event Listener: Triggered whenever a user clicks inside the canvas
network.on("doubleClick", function (params) {
	// Check if a node was actually clicked (params.nodes contains array of clicked node IDs)
	if (params.nodes.length > 0) {
		const clickedNode = params.nodes[0];


		fetchWikiLinks(nodes.get(clickedNode).id, false);
	}
});

document.getElementById('maxParasSlider').addEventListener('input', function() {
    document.getElementById('paraCount').textContent = this.value;
});

async function fetchWikiLinks(articleTitle, newBool) {

	inputTitle = articleTitle;

	const baseUrl = "https://en.wikipedia.org/w/api.php";
	const url = `${baseUrl}?action=parse&page=${encodeURIComponent(articleTitle)}&redirects=1&format=json&origin=*`;

	const para_slider = document.getElementById("maxParasSlider")
	const max_paras = parseInt(para_slider.value, 10);

	try {
		const response = await fetch(url);
		const data = await response.json();

		// if (data.parse && data.parse.links) {
		// 	const links = data.parse.links;

		// 	// Filter links before adding them to the graph
		// 	const filteredLinks = links.filter(link => {
		// 	const title = link['*'];
			
		// 	// 1. ns === 0 ensures it belongs to the standard '/wiki/' article space
		// 	// 2. !title.includes(':') strictly excludes pages like 'Portal:Main', 'Special:Search', etc.
		// 	return link.ns === 0 && !title.includes(':');
		// 	});

		// 	// Limit to the first 20 valid links to keep the graph readable
		// 	console.log(filteredLinks)
		// 	const limitedLinks = filteredLinks.slice(0, 25); 
		// 	updateGraph(articleTitle, limitedLinks);
		// } 

		const mainTitle = data.parse.title;

		if (data.parse && data.parse.text) {			
			htmlText = data.parse.text["*"];
			console.log(data.parse);
			
			const parser = new DOMParser();
			const document = parser.parseFromString(htmlText, 'text/html');
			
			if (newBool == true) {
				nodes.clear();
				edges.clear();
				nodes.add({
					id: data.parse.title,
					label: data.parse.title
				});
				inputTitle = data.parse.title;
			}
	
			const paragraph_objects = document.querySelectorAll(".mw-parser-output > p");
			const paragraphs = [];
			// const max_paras = 5;
			// const max_paras = parseInt(document.getElementById("maxParasSlider").value, 10);
	
			for (let p of paragraph_objects) {
				if (p.textContent.trim().length > 0 ) {
					// 1. Find and completely remove all <sup> elements (citations like [1], [2])
					const citations = p.querySelectorAll('sup');
					citations.forEach(sup => sup.remove());

					// 2. Find all remaining <a> tags inside the container
					const links = p.querySelectorAll('a');

					// 3. Loop through and convert relative paths to absolute paths
					links.forEach(link => {
						const href = link.getAttribute('href'); 

						if (href && href.startsWith('/')) {
							link.href = `https://en.wikipedia.org${href}`;
							link.setAttribute('target', '_blank');
							link.setAttribute('rel', 'noopener noreferrer');
						}
						link.style.color = '#4d5e79';
					});	

					paragraphs.push(p);
				}
				if (paragraphs.length === parseInt(para_slider.max)) {
					break;
				}
			}
			
			console.log(parameter_div);
			

			parameter_div.replaceChildren(...paragraphs.slice(0,3));
			article_title.innerText = mainTitle;
			

			// console.log(paragraphs);
			paragraphs.slice(0,max_paras).forEach(paragraph => {
				paragraph.querySelectorAll('a').forEach(link => {
					const href = link.getAttribute('href');
					const title = link.getAttribute('title');

					if (href && href.includes("/wiki/") && title && !title.includes(":")) {
						
						if (!nodes.get(title)) {
						nodes.add({
							id: title,
							label: title
						});
						}

						
						const edgeId = `${mainTitle}-${title}`;
						if (!edges.get(edgeId)) {
						edges.add({
							id: edgeId,
							from: inputTitle,
							to: title
						});
						}
					}

				});

			});


		}

		
	} catch (error) {
		console.error("Error filtering or fetching MediaWiki data:", error);
	}
}



function updateGraph(articleTitle, links) {
	links.forEach(link => {
		const newTitle = link['*'];

		// Add node if it doesn't exist
		if (!nodes.get(newTitle)) {
		  nodes.add({
			id: newTitle,
			label: newTitle
		  });
		}

		// Add edge if it doesn't exist
		const edgeId = `${articleTitle}-${newTitle}`;
		if (!edges.get(edgeId)) {
		  edges.add({
			id: edgeId,
			from: articleTitle,
			to: newTitle
		  });
		}
	});
}