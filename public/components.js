//== Root Component ============================================================
const RootComponent = {
	name: 'RootComponent', 
	
  	data()
  	{
    	return {
			loading: false, 
			elements: [], 
			currentElements: [],
			maxLvl: 0, 
			level:0, 
		}
  	},

	methods:
	{
		startingjson()
		{
			this.loading = true;
			this.level = 1
		},
		jsonCallEnded(x)
		{
			this.loading = false;
			this.elements = x
			this.currentElements = x
		},
		directoryClicked(y)
		{
			this.level += 1
			this.elements.push(y.elements)
			this.currentElements = y.elements
		},
		goBack()
		{
			this.elements.pop()
			this.level > 2 ? this.currentElements = this.elements[this.elements.length-1] : this.currentElements = this.elements
			this.level -= 1
			
		},

		resetValues()
		{
			this.elements = []
			this.currentElements = []
		}

	},
	template: 
	`
		<InitializerComponent @resetValues="resetValues" @recLevelChanged="maxLvl=$event" @jsonCallStarted="startingjson" @jsonCallEnded="jsonCallEnded"> </InitializerComponent>
		<p v-if="this.loading==true"> Loading... </p>
		<ViewerComponent @directoryClicked="directoryClicked" @goBack="goBack" :maxLevel="maxLvl" :currentElements="currentElements" :currentLevel="level" 
		v-if="elements.length > 0"> </ViewerComponent>
		
		
		
  	`
}

//== Initializer ============================================================
const InitializerComponent = {
  	name: 'InitializerComponent',
    emits: ['recLevelChanged', 'jsonCallStarted', 'jsonCallEnded', 'resetValues'],
  	data()
  	{
    	return {
			url: "",
			recLevel: 0,
			maxElements: 0,
    	}
  	}, 

	methods:
	{
		resetValues()
		{
			this.url= ""
			this.recLevel = 0
			this.maxElements = 0
			this.$emit('resetValues')
		},

		getJSON()
		{
			this.$emit('recLevelChanged', this.recLevel)
			this.$emit('jsonCallStarted');
			fetch(`https://webvisualizer-backend.herokuapp.com/json?url=${this.url}&recLevel=${this.recLevel}&maxElements=${this.maxElements}`)
			.then(response => response.json())
      		.then(x => this.$emit('jsonCallEnded', x))
			.catch(error => console.error(error));
		}
	},
	computed:
	{
		setButtonActive()
		{
			return (this.url.length > 0 && this.maxElements > 0 && this.recLevel > 0)
		}
	},
	template: 
	`
	<div>
		URI: <input type="text" v-model="url"> <br/>
		RecLevel: <input type="number" v-model="recLevel"> <br/>
		MaxElements: <input input type="number" v-model="maxElements"> <br/>
		<button type="button" :disabled="!setButtonActive" @click="getJSON();"> Get JSON </button>
		<button type="button" @click="resetValues"> Reset values </button>
	</div>
	`
  
};

//== Viewer ============================================================
const ViewerComponent = {
	name: 'ViewerComponent',
	props: ['currentElements', 'currentLevel', 'maxLevel'],
	emits: ['directoryClicked', 'goBack'],
	data()
	{
		return {

		}
	}, 
	methods:
	{
		directoryClicked(y)
		{
			if (y.elements)
			{
				this.$emit('directoryClicked', y);
			}	
		},
		goBack()
		{
			this.$emit('goBack');
		}
		
	},
	template: 
	`

		<div>
			<span> {{currentLevel}}/ {{maxLevel}} </span>	
			<div>
				<button v-if="currentLevel > 1" @click="goBack"> Go Back </button>	
			</div>
			<ul v-for="link in currentElements">
				<div v-if="link.type=='file'"> <FileComponent :url=link.name > </FileComponent> </div>
				<div v-if="link.type=='webpage'"> <DirectoryComponent :currentLevel=currentLevel :maxLevel=maxLevel :id=link :url=link.name @directoryClicked="directoryClicked"> </DirectoryComponent> </div>
			</ul>

		</div>
	`
	
};

//== File ============================================================
const FileComponent = {
	name: 'FileComponent',
	props: ['url'],
	data()
	{
		return{
			nom:"",
		} 
	},
	methods:
	{
		justFileName()
		{
			this.nom = this.url

			return this.nom.split("/").pop()
		},
		
	},
	template:
	`
		<p> {{justFileName()}} <a :href=url target="_blank"> Open in a new window </a> </p> 	
	`
};

//== Directory ============================================================
const DirectoryComponent = {
	name: 'DirectoryComponent',
	props: ['url', 'id', 'currentLevel', 'maxLevel'],
	emits: ['directoryClicked'],
	methods:
	{
		justFileName()
		{
			filename = this.url.substring(this.url.lastIndexOf('/')+1);
			return filename
		},
		clicked()
		{
			this.$emit('directoryClicked', this.id); 		
		},
		getZip()
		{
			fetch(`https://webvisualizer-backend.herokuapp.com/zip?url=${this.url}`)
			.then(res => res.blob())
			.then(data => 
				{
					var a = document.createElement("a")
					a.href = window.URL.createObjectURL(data)
					a.download = "matiiii.zip"
					a.click()
				})
		}
	},
	//:href=url
	template:
	`	
		<div v-if="maxLevel != currentLevel">
			<a style="text-decoration:underline" @click="clicked" > {{justFileName()}}  </a>
			<button @click="getZip"> Download ZIP </button>
		</div> 

		<p v-if="maxLevel == currentLevel">  {{justFileName()}} <button @click="getZip"> Download ZIP </button> </p>
	`
};


const app = Vue.createApp(RootComponent);
app.component('InitializerComponent', InitializerComponent);
app.component('ViewerComponent', ViewerComponent);
app.component('FileComponent', FileComponent);
app.component('DirectoryComponent', DirectoryComponent);
const vm = app.mount("#app");
