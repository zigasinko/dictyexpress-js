import _ from 'lodash';
import { makeAutoObservable } from 'mobx';
import { Gene, GenesById } from 'redux/models/internal';

class GenesStoreMobx {
    genesById = {} as GenesById;

    selectedGenesIds = [] as string[];

    highlightedGenesIds = [] as string[];

    isFetchingDifferentialExpressionGenes = false;

    isFetchingAssociationsGenes = false;

    isFetchingSimilarGenes = false;

    isFetchingBookmarkedGenes = false;

    constructor() {
        makeAutoObservable(this);
    }

    differentialExpressionGenesFetchStarted(): void {
        this.isFetchingDifferentialExpressionGenes = true;
    }

    associationsGenesFetchStarted(): void {
        this.isFetchingAssociationsGenes = true;
    }

    similarGenesFetchStarted(): void {
        this.isFetchingSimilarGenes = true;
    }

    bookmarkedGenesFetchStarted(): void {
        this.isFetchingBookmarkedGenes = true;
    }

    differentialExpressionGenesFetchEnded(): void {
        this.isFetchingDifferentialExpressionGenes = false;
    }

    associationsGenesFetchEnded(): void {
        this.isFetchingAssociationsGenes = false;
    }

    similarGenesFetchEnded(): void {
        this.isFetchingSimilarGenes = false;
    }

    bookmarkedGenesFetchEnded(): void {
        this.isFetchingBookmarkedGenes = false;
    }

    setGenesById(selectedGenes: Gene[]): void {
        this.genesById = _.keyBy(selectedGenes, 'feature_id');
    }

    genesSelected(genesIds: string[]): void {
        genesIds.forEach((geneId) => {
            if (!this.selectedGenesIds.includes(geneId)) {
                this.selectedGenesIds.push(geneId);
            }
        });
    }

    geneDeselected(deselectedGeneId: string): void {
        this.selectedGenesIds = this.selectedGenesIds.filter(
            (geneId) => geneId !== deselectedGeneId,
        );
    }

    allGenesDeselected(): void {
        this.selectedGenesIds = [];
    }

    genesHighlighted(genesIds: string[]): void {
        this.highlightedGenesIds = genesIds;
    }

    geneHighlighted(geneId: string): void {
        this.highlightedGenesIds.push(geneId);
    }

    geneUnhighlighted(unhighlightedGeneId: string): void {
        this.highlightedGenesIds = this.highlightedGenesIds.filter(
            (geneId) => unhighlightedGeneId !== geneId,
        );
    }

    clearSelectedGenesIds(): void {
        this.selectedGenesIds = [];
    }

    get genes(): Gene[] {
        return _.flatMap(this.genesById);
    }

    get genesIdsInStore(): string[] {
        return this.genes.map((gene) => gene.feature_id);
    }

    get selectedGenes(): Gene[] {
        return this.selectedGenesIds
            .map((geneId) => this.genesById[geneId])
            .filter((gene) => gene != null);
    }

    get species(): string {
        return this.selectedGenes.length > 0 ? this.selectedGenes[0].species : '';
    }

    get source(): string {
        return this.selectedGenes.length > 0 ? this.selectedGenes[0].source : '';
    }
}

export default GenesStoreMobx;
