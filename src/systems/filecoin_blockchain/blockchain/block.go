package blockchain

func SmallerBytes(a, b Bytes) Bytes {
	if CompareBytesStrict(a, b) > 0 {
		return b
	}
	return a
}

func ExtractElectionSeed(lookbackTipset *TipsetI) ElectionSeed {

	Panic("TODO")
	// var ret []byte

	// for _, currBlock := range lookbackTipset.Blocks() {
	// 	for _, currTicket := range currBlock.Tickets() {

	// 		currSeed := Hash(
	// 			HashRole_ElectionSeedFromVRFOutput,
	// 			currTicket.VRFResult().bytes(),
	// 		)
	// 		if ret == nil {
	// 			ret = currSeed
	// 		} else {
	//             ret = SmallerBytes(currSeed, ret)
	//         }
	// 	}
	// }

	// Assert(ret != nil)
	// return ElectionSeed.FromBytesInternal(nil, ret)
}

// func GenerateElectionTicket(k VRFKeyPair, seed ElectionSeed) Ticket {
// 	var vrfResult VRFResult = VRFEval(k, seed.ToBytesInternal())

// 	var vdfInput []byte = Hash(
// 		HashRole_TicketVDFInputFromVRFOutput,
// 		vrfResult.ToBytesInternal(),
// 	)
// 	var vdfResult VDFResult = VDFEval(vdfInput)

// 	return &TicketI{
// 		vrfResult,
// 		vdfResult,
// 	}
// }

func (self *Block_I) ValidateTickets() bool {
	for _, tix := range self.Tickets() {
		panic("TODO")
		// tix.Validate()
	}
}

func (tix *Ticket_I) ValidateSyntax() bool {

	return VRFResult.validateSyntax() &&
		VDFResult.validateSyntax()

}

func (tix *Ticket_I) Validate(input Bytes, pk VRFPublicKey) bool {
	return tix.VRFResult.Verify(input, pk) &&
		tix.VDFResult.Verify(tix.VDFResult.GetOutput())
}

func (ep *ElectionProof_I) ValidateSyntax() bool {
	return VRFResult.validateSyntax()
}

func (ep *ElectionProof_I) Validate(input Bytes, pk VRFPublicKey) bool {
	return tix.VRFResult.Verify(input, pk)
}

func (ep *ElectionProof_I) IsWinning(power PowerFraction) bool {
	Panic("TODO")
}

func (ts *Tipset_I) ValidateSyntax() bool {

	if !len(ts.Blocks) > 0 {
		return false
	}

	parents := ts.Parents()
	grandparent := parents[0].Parents()
	for i := 1; i < len(parents); i++ {
		if grandparent != parents[i].Parents() {
			return false
		}
	}

	numTickets := len(ts.Blocks[0].Tickets())
	for i := 1; i < len(ts.Blocks); i++ {
		if numTickets != len(ts.Blocks[i].Tickets()) {
			return false
		}
	}

	return true
}

func (ts *Tipset_I) LatestTimestamp() {
	var latest Time
	for _, blk := range ts.Blocks {
		if blk.Timestamp().After(latest) || latest.IsZero() {
			latest = blk.Timestamp()
		}
	}
	return latest
}

func (tipset *Tipset_I) StateTree() StateTree {
	var currTree StateTree = nil
	for _, block := range tipset.Blocks() {
		if currTree == nil {
			currTree = block.StateTree()
		} else {
			Assert(block.StateTree().CID().Equals(currTree.CID()))
		}
	}
	Assert(currTree != nil)
	for _, block := range tipset.Blocks() {
		currTree = UpdateStateTree(currTree, block)
	}
	return currTree
}
