const linksEle = document.getElementById("links");
fetch("./versions.json").then(response => response.json()).then(e => Object.entries(e).filter(e => e[0] && e[1] && e[1].length).map(e => {
	const ele = document.createElement("details");
	ele.id = "links-" + e[0];
	ele.classList.add("linksEle");
	const ele1 = document.createElement("summary");
	const ele2 = document.createElement("h2");
	ele2.innerText = e[0];
	ele2.classList.add("extension-name");
	ele1.insertAdjacentElement("beforeend", ele2);
	ele.insertAdjacentElement("beforeend", ele1);
	const ele3 = document.createElement("ul");
	e[1].toReversed().forEach(version => {
		const liEle = document.createElement("li");
		const aEle = document.createElement("a");
		aEle.href = `extensions/${e[0]}-${version}.vsix`;
		aEle.innerText = `Version ${version}`;
		liEle.insertAdjacentElement("beforeend", aEle);
		ele3.insertAdjacentElement("beforeend", liEle)
	});
	const child = ele3.children[5];
	if (child) {
		child.insertAdjacentHTML("beforebegin", '<li class="lisum"><details><summary>Historical versions</summary></details></li>')
	}
	ele.insertAdjacentElement("beforeend", ele3);
	linksEle.insertAdjacentElement("beforeend", ele)
}));
