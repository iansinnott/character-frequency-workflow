.PHONY: clean

all: clean build

build: index ChineseCharacterComposition.alfredworkflow

clean:
	rm ./index
	rm ./ChineseCharacterComposition.alfredworkflow

index:
	yarn build

./ChineseCharacterComposition.alfredworkflow:
	./node_modules/.bin/awf export .
	mv chinesefrequency.keyboardmaestro.alfredworkflow ChineseCharacterComposition.alfredworkflow
